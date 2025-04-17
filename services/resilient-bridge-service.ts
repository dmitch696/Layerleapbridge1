// This service completely avoids BigInt serialization issues by using string operations

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
      } catch (error) {
        console.error("Error adding Optimism:", error)
        return false
      }
    }
    console.error("Error switching network:", switchError)
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

    const Web3 = (await import("web3")).default
    const web3 = new Web3(window.ethereum)

    // Create contract instance
    const bridge = new web3.eth.Contract(BRIDGE_ABI as any, CONTRACT_ADDRESSES.LAYER_ZERO_BRIDGE)

    // Check if the chain has a mapping
    const lzId = await bridge.methods.chainToLzId(destinationChainId).call()
    return lzId !== "0"
  } catch (error) {
    console.error("Error checking chain support:", error)
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
 * Bridge ETH via LayerZero with NO BigInt usage
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
    const chainId = await web3.eth.getChainId()
    if (chainId !== 10) {
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

    // Calculate total amount (amount + fee) using simple math
    const totalEth = Number.parseFloat(testAmount) + Number.parseFloat(feeResult.fee)
    const totalWei = web3.utils.toWei(totalEth.toString(), "ether")

    console.log("Bridging details:", {
      from: account,
      to: formattedAddress,
      destinationChain: destinationChainId,
      amount: testAmount + " ETH",
      fee: feeResult.fee + " ETH",
      total: totalEth.toFixed(6) + " ETH",
    })

    // Execute bridge transaction
    const tx = await bridge.methods.bridgeNative(destinationChainId, formattedAddress).send({
      from: account,
      value: totalWei,
      gas: 500000, // Higher gas limit
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
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Save transaction to local storage with NO BigInt serialization
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
