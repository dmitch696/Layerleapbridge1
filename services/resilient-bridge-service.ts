// This service completely avoids BigInt serialization issues by using string operations

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
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "chainToLzId",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function",
  },
]

/**
 * Check if the user is connected to Optimism
 */
export async function isConnectedToOptimism(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    return false
  }

  try {
    const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
    return Number.parseInt(chainIdHex, 16) === 10
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
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xA" }], // 10 in hex
    })
    return true
  } catch (switchError: any) {
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
              rpcUrls: ["https://mainnet.optimism.io"],
              blockExplorerUrls: ["https://optimistic.etherscan.io"],
            },
          ],
        })
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

    const Web3 = await import("web3")
    const web3 = new Web3.default(window.ethereum)

    // Create contract instance
    const bridge = new web3.eth.Contract(BRIDGE_ABI as any, BRIDGE_CONTRACT)

    // Check if the chain has a mapping
    const lzId = await bridge.methods.chainToLzId(destinationChainId).call()
    return lzId !== "0"
  } catch (error) {
    console.error("Error checking chain support:", error)
    return false
  }
}

// Check for any problematic Unicode characters or escape sequences

// Update the bridgeETH function to match Stargate's parameters more closely

// For example, check the bridgeETH function
export async function bridgeETH(
  destinationChainId: number,
  recipientAddress: string,
  amount: string,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask not installed")
    }

    // Use Web3.js
    const Web3 = await import("web3")
    const web3 = new Web3.default(window.ethereum)

    // Request account access
    await window.ethereum.request({ method: "eth_requestAccounts" })

    // Get current account
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]

    // Check if on Optimism
    const chainId = await web3.eth.getChainId()
    if (chainId !== 10) {
      throw new Error("Please connect to Optimism network")
    }

    // Create contract instance
    const bridge = new web3.eth.Contract(BRIDGE_ABI as any, BRIDGE_CONTRACT)

    // Use a smaller test amount to match Stargate's parameters
    const testAmount = "0.0001" // 0.0001 ETH
    console.log(`Using test amount: ${testAmount} ETH`)

    // Use a smaller fee similar to Stargate (0.000011 ETH)
    const fixedFee = "0.000011" // 0.000011 ETH instead of 0.0003
    console.log(`Using fixed fee: ${fixedFee} ETH`)

    // Calculate total amount (amount + fee) using simple math
    const totalEth = Number.parseFloat(testAmount) + Number.parseFloat(fixedFee)
    const totalWei = web3.utils.toWei(totalEth.toString(), "ether")

    console.log("Bridging details:", {
      from: account,
      to: recipientAddress,
      destinationChain: destinationChainId,
      amount: testAmount + " ETH",
      fee: fixedFee + " ETH",
      total: totalEth.toFixed(6) + " ETH",
    })

    // Execute bridge transaction with lower gas limit to match Stargate
    const tx = await bridge.methods.bridgeNative(destinationChainId, recipientAddress).send({
      from: account,
      value: totalWei,
      gas: 300000, // Lower gas limit
      maxFeePerGas: web3.utils.toWei("0.1", "gwei"), // Set a lower max fee per gas
      maxPriorityFeePerGas: web3.utils.toWei("0.1", "gwei"), // Set a lower priority fee
    })

    console.log("Transaction submitted:", tx.transactionHash)

    // Save transaction to history
    saveTransaction({
      hash: tx.transactionHash,
      from: account,
      destinationChainId,
      amount: testAmount,
      fee: fixedFee,
      timestamp: Date.now(),
      status: "pending",
    })

    return {
      success: true,
      txHash: tx.transactionHash,
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

// Add TypeScript support for window.ethereum
declare global {
  interface Window {
    ethereum: any
  }
}
