import { CONTRACT_ADDRESSES, BRIDGE_ABI } from "@/config/contracts"

// Chain data for UI
export const CHAINS = [
  { id: 1, name: "Ethereum", logo: "🔷" },
  { id: 42161, name: "Arbitrum", logo: "🔶" },
  { id: 137, name: "Polygon", logo: "🟣" },
  { id: 8453, name: "Base", logo: "🔵" },
  { id: 43114, name: "Avalanche", logo: "❄️" },
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

/**
 * Check if the user is connected to Optimism with multiple fallback methods
 */
export async function isConnectedToOptimism(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    return false
  }

  try {
    // Method 1: Direct provider request
    try {
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
      const chainId = Number.parseInt(chainIdHex, 16)
      console.log("Chain ID from direct provider request:", chainId)
      if (chainId === 10) return true
    } catch (error) {
      console.warn("Failed to get chain ID via eth_chainId:", error)
    }

    // Method 2: Try using Web3 if available
    try {
      const Web3 = (await import("web3")).default
      const web3 = new Web3(window.ethereum)
      const web3ChainId = await web3.eth.getChainId()
      console.log("Chain ID from Web3:", web3ChainId)
      if (web3ChainId === 10) return true
    } catch (error) {
      console.warn("Failed to get chain ID via Web3:", error)
    }

    // Method 3: Try net_version (older method)
    try {
      const networkVersion = await window.ethereum.request({ method: "net_version" })
      console.log("Network version:", networkVersion)
      if (networkVersion === "10") return true
    } catch (error) {
      console.warn("Failed to get network version:", error)
    }

    return false
  } catch (error) {
    console.error("Error checking Optimism connection:", error)
    return false
  }
}

/**
 * Switch to Optimism network with better error handling
 */
export async function switchToOptimism(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    return false
  }

  try {
    // Check if already on Optimism
    if (await isConnectedToOptimism()) {
      console.log("Already on Optimism network")
      return true
    }

    console.log("Switching to Optimism network...")

    // Try to switch to Optimism
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xA" }], // 10 in hex
    })

    // Wait a moment for the switch to take effect
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Verify the switch was successful
    return await isConnectedToOptimism()
  } catch (switchError: any) {
    console.error("Error switching to Optimism:", switchError)

    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        console.log("Adding Optimism network to MetaMask...")
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

        // Wait a moment for the network to be added
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Try switching again
        return await switchToOptimism()
      } catch (addError) {
        console.error("Error adding Optimism network:", addError)
        return false
      }
    }

    return false
  }
}

/**
 * Check if a destination chain is supported with retries
 */
export async function isChainSupported(destinationChainId: number): Promise<boolean> {
  const MAX_RETRIES = 3
  let retries = 0

  while (retries < MAX_RETRIES) {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        return false
      }

      const Web3 = (await import("web3")).default
      const web3 = new Web3(window.ethereum)

      // Create contract instance
      const bridge = new web3.eth.Contract(BRIDGE_ABI as any, CONTRACT_ADDRESSES.LAYER_ZERO_BRIDGE)

      // Check if the chain has a mapping
      const lzId = await bridge.methods.chainToLzId(destinationChainId).call()
      console.log(`Chain ${destinationChainId} has LayerZero ID: ${lzId}`)
      return lzId !== "0"
    } catch (error) {
      console.error(`Error checking chain support (attempt ${retries + 1}/${MAX_RETRIES}):`, error)
      retries++

      if (retries < MAX_RETRIES) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }

  console.error(`Failed to check chain support after ${MAX_RETRIES} attempts`)
  return false
}

/**
 * Get fee estimate for bridging with retries
 */
export async function getBridgeFee(
  destinationChainId: number,
  recipientAddress: string,
  amount: string,
): Promise<{ success: boolean; fee?: string; error?: string }> {
  const MAX_RETRIES = 3
  let retries = 0

  while (retries < MAX_RETRIES) {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask not installed")
      }

      const Web3 = (await import("web3")).default
      const web3 = new Web3(window.ethereum)

      // Create contract instance
      const bridge = new web3.eth.Contract(BRIDGE_ABI as any, CONTRACT_ADDRESSES.LAYER_ZERO_BRIDGE)

      // Format address
      const formattedAddress = recipientAddress.startsWith("0x") ? recipientAddress : `0x${recipientAddress}`

      // Convert amount to wei string
      const amountWei = web3.utils.toWei(amount, "ether")

      // Get fee estimate
      const feeWei = await bridge.methods.estimateFee(destinationChainId, formattedAddress, amountWei).call()
      console.log(`Raw fee estimate: ${feeWei} wei`)

      // Convert to ETH and add 10% buffer
      const feeEth = web3.utils.fromWei(feeWei, "ether")
      const feeWithBuffer = (Number.parseFloat(feeEth) * 1.1).toFixed(6)
      console.log(`Fee with buffer: ${feeWithBuffer} ETH`)

      return {
        success: true,
        fee: feeWithBuffer,
      }
    } catch (error: any) {
      console.error(`Fee estimation error (attempt ${retries + 1}/${MAX_RETRIES}):`, error)
      retries++

      if (retries < MAX_RETRIES) {
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } else {
        return {
          success: false,
          error: error.message,
        }
      }
    }
  }

  return {
    success: false,
    error: "Failed to estimate fee after multiple attempts",
  }
}

/**
 * Bridge ETH via LayerZero with improved error handling and retries
 */
export async function bridgeETH(
  destinationChainId: number,
  recipientAddress: string,
  amount: string,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    // Request account access
    await window.ethereum.request({ method: "eth_requestAccounts" })

    const Web3 = (await import("web3")).default
    const web3 = new Web3(window.ethereum)

    // Check if on Optimism
    const isOnOptimism = await isConnectedToOptimism()
    if (!isOnOptimism) {
      throw new Error("Please connect to Optimism network")
    }

    // Get current account
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]

    // Create contract instance
    const bridge = new web3.eth.Contract(BRIDGE_ABI as any, CONTRACT_ADDRESSES.LAYER_ZERO_BRIDGE)

    // Format address
    const formattedAddress = recipientAddress.startsWith("0x") ? recipientAddress : `0x${recipientAddress}`

    // Verify the chain is supported
    const isSupported = await isChainSupported(destinationChainId)
    if (!isSupported) {
      throw new Error(`Destination chain ${destinationChainId} is not supported by the bridge contract.`)
    }

    // Get fee estimate
    const feeResult = await getBridgeFee(destinationChainId, formattedAddress, amount)
    if (!feeResult.success || !feeResult.fee) {
      throw new Error("Failed to estimate fee")
    }

    // Use a very small amount for testing
    const testAmount = "0.0001"
    console.log(`Using test amount: ${testAmount} ETH instead of ${amount} ETH for safety`)

    // Convert amount to wei
    const amountWei = web3.utils.toWei(testAmount, "ether")
    console.log(`Amount: ${testAmount} ETH (${amountWei} wei)`)

    // Convert fee to wei
    const feeWei = web3.utils.toWei(feeResult.fee, "ether")
    console.log(`Fee: ${feeResult.fee} ETH (${feeWei} wei)`)

    // Calculate total value to send
    const totalWei = web3.utils.toBN(amountWei).add(web3.utils.toBN(feeWei)).toString()
    console.log(`Total: ${web3.utils.fromWei(totalWei, "ether")} ETH (${totalWei} wei)`)

    // Log the exact parameters we're sending to the contract
    console.log("Contract call parameters:", {
      method: "bridgeNative",
      destinationChainId: destinationChainId,
      recipient: formattedAddress,
      value: totalWei,
    })

    // First, check if the chain ID mapping exists
    const lzId = await bridge.methods.chainToLzId(destinationChainId).call()
    console.log(`LayerZero ID for chain ${destinationChainId}: ${lzId}`)
    if (lzId === "0") {
      throw new Error(`Chain ID ${destinationChainId} is not supported by the bridge contract.`)
    }

    // Try a test call first to see if it would succeed
    try {
      await bridge.methods.bridgeNative(destinationChainId, formattedAddress).call({
        from: account,
        value: totalWei,
      })
      console.log("Test call succeeded! Proceeding with actual transaction.")
    } catch (callError: any) {
      console.error("Test call failed:", callError)
      throw new Error(`Transaction would fail: ${callError.message}`)
    }

    // Estimate gas with a higher limit
    let gasEstimate
    try {
      gasEstimate = await bridge.methods.bridgeNative(destinationChainId, formattedAddress).estimateGas({
        from: account,
        value: totalWei,
      })
      console.log("Gas estimate:", gasEstimate)
    } catch (gasError: any) {
      console.error("Gas estimation failed:", gasError)
      throw new Error(`Gas estimation failed: ${gasError.message}`)
    }

    // Add a significant buffer to the gas estimate
    const gasLimit = Math.floor(gasEstimate * 1.5)
    console.log(`Using gas limit: ${gasLimit} (1.5x the estimate)`)

    // Execute bridge transaction with retry logic
    let txHash
    const MAX_TX_RETRIES = 2
    let txRetries = 0

    while (txRetries < MAX_TX_RETRIES && !txHash) {
      try {
        console.log(`Sending transaction (attempt ${txRetries + 1}/${MAX_TX_RETRIES})...`)

        const tx = await bridge.methods.bridgeNative(destinationChainId, formattedAddress).send({
          from: account,
          value: totalWei,
          gas: gasLimit,
        })

        txHash = tx.transactionHash
        console.log("Transaction submitted:", txHash)
      } catch (txError: any) {
        console.error(`Transaction error (attempt ${txRetries + 1}/${MAX_TX_RETRIES}):`, txError)
        txRetries++

        if (txRetries < MAX_TX_RETRIES) {
          console.log("Retrying transaction...")
          await new Promise((resolve) => setTimeout(resolve, 2000))
        } else {
          throw new Error(`Transaction failed after ${MAX_TX_RETRIES} attempts: ${txError.message}`)
        }
      }
    }

    if (!txHash) {
      throw new Error("Failed to submit transaction")
    }

    // Save transaction to history
    saveTransaction({
      hash: txHash,
      from: account,
      destinationChainId,
      amount: testAmount, // Use the test amount
      fee: feeResult.fee,
      timestamp: Date.now(),
      status: "pending",
    })

    return {
      success: true,
      txHash: txHash,
    }
  } catch (error: any) {
    console.error("Bridge error:", error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Save transaction to local storage with error handling
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

    // Ensure all values are serializable (no BigInt)
    const safeJson = JSON.stringify(updatedTxs)

    // Save to local storage
    localStorage.setItem(TX_HISTORY_KEY, safeJson)
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
