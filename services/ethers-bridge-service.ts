// Chain data for UI
export const CHAINS = [
  { id: 1, name: "Ethereum", logo: "🔷" },
  { id: 42161, name: "Arbitrum", logo: "🔶" },
  { id: 137, name: "Polygon", logo: "🟣" },
  { id: 8453, name: "Base", logo: "🔵" },
  { id: 43114, name: "Avalanche", logo: "❄️" },
]

// Bridge contract address on Optimism
const BRIDGE_CONTRACT = "0xB84361304A2DBe4707FF7D6E06cE32E0cd05D902"

// Minimal ABI for the bridge contract
const BRIDGE_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "destinationChainId", type: "uint256" },
      { internalType: "address", name: "recipient", type: "address" },
    ],
    name: "bridgeNative",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "destinationChainId", type: "uint256" },
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "estimateFee",
    outputs: [{ internalType: "uint256", name: "fee", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "chainToLzId",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function",
  },
]

// Transaction type
export interface BridgeTransaction {
  hash: string
  from: string
  destinationChainId: number
  amount: string
  fee: string
  timestamp: number
  status: "pending" | "completed" | "failed"
}

// Helper function to safely import ethers
async function getEthers() {
  try {
    // Try to import ethers v5
    const ethers = await import("ethers@5.7.2")
    return ethers
  } catch (error) {
    console.error("Failed to import ethers v5, trying default import:", error)
    try {
      // Fallback to whatever version is installed
      const ethers = await import("ethers")
      return ethers
    } catch (fallbackError) {
      console.error("Failed to import ethers:", fallbackError)
      throw new Error("Failed to load ethers.js library")
    }
  }
}

/**
 * Check if the user is connected to Optimism
 */
export async function isConnectedToOptimism(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    return false
  }

  try {
    // Method 1: Direct provider request for chainId - most reliable method
    const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
    const chainId = Number.parseInt(chainIdHex, 16)
    console.log("Chain ID from direct provider request:", chainId, "Hex:", chainIdHex)

    if (chainId === 10) {
      console.log("✅ Connected to Optimism (chainId: 10)")
      return true
    }

    // Method 2: Use Web3.js as fallback if available
    try {
      const Web3 = (await import("web3")).default
      const web3 = new Web3(window.ethereum)
      const networkId = await web3.eth.getChainId()
      console.log("Network ID from Web3.js:", networkId)

      if (networkId === 10) {
        console.log("✅ Connected to Optimism (Web3 chainId: 10)")
        return true
      }
    } catch (web3Error) {
      console.error("Error using Web3.js for network detection:", web3Error)
    }

    // Method 3: Try network version as a last resort
    try {
      const networkVersion = await window.ethereum.request({ method: "net_version" })
      console.log("Network version:", networkVersion)

      if (networkVersion === "10") {
        console.log("✅ Connected to Optimism (networkVersion: 10)")
        return true
      }
    } catch (versionError) {
      console.error("Error getting network version:", versionError)
    }

    console.log("❌ Not connected to Optimism - detected chain ID:", chainId)
    return false
  } catch (error) {
    console.error("Error checking network:", error)
    return false
  }
}

/**
 * Switch to Optimism network
 */
export async function switchToOptimism(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    return false
  }

  try {
    // Try to switch to Optimism
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xA" }], // 10 in hex
    })

    // Verify the switch was successful
    return await isConnectedToOptimism()
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xA",
              chainName: "Optimism",
              nativeCurrency: {
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: [
                "https://mainnet.optimism.io",
                "https://optimism-mainnet.public.blastapi.io",
                "https://1rpc.io/op",
              ],
              blockExplorerUrls: ["https://optimistic.etherscan.io"],
            },
          ],
        })

        // Try switching again after adding
        return await switchToOptimism()
      } catch (addError) {
        console.error("Error adding Optimism network:", addError)
        return false
      }
    }

    console.error("Error switching to Optimism:", switchError)
    return false
  }
}

/**
 * Check if a destination chain is supported
 */
export async function isChainSupported(destinationChainId: number): Promise<boolean> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      return false
    }

    // Hardcoded supported chains as fallback
    const defaultSupportedChains = [1, 42161, 137, 8453, 43114]

    try {
      // Use Web3.js instead of ethers.js for more reliable compatibility
      const Web3 = (await import("web3")).default
      const web3 = new Web3(window.ethereum)

      // Create contract instance
      const bridge = new web3.eth.Contract(BRIDGE_ABI as any, BRIDGE_CONTRACT)

      // Check if the chain has a mapping
      const lzId = await bridge.methods.chainToLzId(destinationChainId).call()
      console.log(`Chain ${destinationChainId} LayerZero ID:`, lzId)

      // If lzId is 0, the chain is not supported
      return lzId !== "0"
    } catch (contractError) {
      console.error("Error checking chain support via contract:", contractError)

      // Fall back to hardcoded values if contract call fails
      console.log("Using fallback chain support list")
      return defaultSupportedChains.includes(destinationChainId)
    }
  } catch (error) {
    console.error("Error in isChainSupported:", error)
    return false
  }
}

/**
 * Get fee estimate for bridging
 */
export async function getBridgeFee(
  destinationChainId: number,
  recipientAddress: string,
  amount: string,
): Promise<{ success: boolean; fee?: string; error?: string }> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    // Use Web3.js instead of ethers.js
    const Web3 = (await import("web3")).default
    const web3 = new Web3(window.ethereum)

    // Create contract instance
    const bridge = new web3.eth.Contract(BRIDGE_ABI as any, BRIDGE_CONTRACT)

    // Format address
    const formattedAddress = recipientAddress

    // Convert amount to wei
    const amountWei = web3.utils.toWei(amount, "ether")

    // Get fee estimate
    const feeWei = await bridge.methods.estimateFee(destinationChainId, formattedAddress, amountWei).call()

    // Convert to ETH and add 10% buffer
    const feeEth = web3.utils.fromWei(feeWei, "ether")
    const feeWithBuffer = (Number.parseFloat(feeEth) * 1.1).toFixed(6)

    return {
      success: true,
      fee: feeWithBuffer,
    }
  } catch (error: any) {
    console.error("Fee estimation error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Bridge ETH using Web3.js instead of ethers.js
 */
export async function bridgeETH(
  destinationChainId: number,
  recipientAddress: string,
  amount: string,
): Promise<{ success: boolean; txHash?: string; error?: string; debugInfo?: any }> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    // Use Web3.js instead of ethers.js
    const Web3 = (await import("web3")).default
    const web3 = new Web3(window.ethereum)

    // Request account access
    await window.ethereum.request({ method: "eth_requestAccounts" })

    // Get current account
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]

    // Check if on Optimism - use our more robust function
    const onOptimism = await isConnectedToOptimism()
    if (!onOptimism) {
      // Get the current chain ID for debugging
      const chainId = await web3.eth.getChainId()
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })

      throw new Error(`Please connect to Optimism network (detected chainId: ${chainId}, hex: ${chainIdHex})`)
    }

    // Use a minimal test amount for safety
    const testAmount = "0.0001" // 0.0001 ETH
    console.log(`Using test amount: ${testAmount} ETH instead of ${amount} ETH for safety`)

    // Get fee estimate
    const feeResult = await getBridgeFee(destinationChainId, recipientAddress, testAmount)
    if (!feeResult.success || !feeResult.fee) {
      throw new Error("Failed to estimate fee")
    }

    // Calculate total amount (amount + fee)
    const totalEth = Number.parseFloat(testAmount) + Number.parseFloat(feeResult.fee)
    const totalWei = web3.utils.toWei(totalEth.toString(), "ether")

    console.log("Bridging details:", {
      from: account,
      to: recipientAddress,
      destinationChain: destinationChainId,
      amount: testAmount + " ETH",
      fee: feeResult.fee + " ETH",
      total: totalEth.toFixed(6) + " ETH",
    })

    // Create contract instance
    const bridge = new web3.eth.Contract(BRIDGE_ABI as any, BRIDGE_CONTRACT)

    // Estimate gas
    let gasEstimate
    try {
      gasEstimate = await bridge.methods.bridgeNative(destinationChainId, recipientAddress).estimateGas({
        from: account,
        value: totalWei,
      })
      console.log("Gas estimate:", gasEstimate)
    } catch (gasError: any) {
      console.error("Gas estimation failed:", gasError)

      // Return detailed error info
      return {
        success: false,
        error: `Gas estimation failed: ${gasError.message}`,
        debugInfo: {
          error: gasError,
          params: {
            destinationChainId,
            recipient: recipientAddress,
            value: totalWei,
          },
        },
      }
    }

    // Execute bridge transaction with higher gas limit
    const tx = await bridge.methods.bridgeNative(destinationChainId, recipientAddress).send({
      from: account,
      value: totalWei,
      gas: Math.floor(gasEstimate * 1.2), // Add 20% buffer
    })

    console.log("Transaction submitted:", tx.transactionHash)

    // Save transaction to history
    saveTransaction({
      hash: tx.transactionHash,
      from: account,
      destinationChainId,
      amount: testAmount,
      fee: feeResult.fee,
      timestamp: Date.now(),
      status: "pending",
    })

    return {
      success: true,
      txHash: tx.transactionHash,
    }
  } catch (error: any) {
    console.error("Bridge error:", error)

    // Return detailed error info
    return {
      success: false,
      error: error.message,
      debugInfo: {
        error: error,
        errorName: error.name,
        errorCode: error.code,
      },
    }
  }
}

/**
 * Save transaction to local storage
 */
function saveTransaction(tx: BridgeTransaction): void {
  try {
    const TX_HISTORY_KEY = "layerleap_bridge_transactions"

    // Get existing transactions
    let existingTxs: BridgeTransaction[] = []
    const txsJson = localStorage.getItem(TX_HISTORY_KEY)

    if (txsJson) {
      existingTxs = JSON.parse(txsJson)
    }

    // Add new transaction
    const updatedTxs = [tx, ...existingTxs]

    // Save to local storage
    localStorage.setItem(TX_HISTORY_KEY, JSON.stringify(updatedTxs))
  } catch (error) {
    console.error("Error saving transaction:", error)
  }
}

/**
 * Get transaction history from local storage
 */
export function getTransactionHistory(): BridgeTransaction[] {
  try {
    if (typeof window === "undefined") {
      return []
    }

    const TX_HISTORY_KEY = "layerleap_bridge_transactions"
    const txsJson = localStorage.getItem(TX_HISTORY_KEY)

    if (!txsJson) {
      return []
    }

    return JSON.parse(txsJson)
  } catch (error) {
    console.error("Error getting transaction history:", error)
    return []
  }
}

// Add TypeScript support for window.ethereum
declare global {
  interface Window {
    ethereum: any
  }
}
