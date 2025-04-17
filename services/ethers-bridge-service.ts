// Import ethers dynamically to avoid SSR issues
import type { BigNumber, ContractTransaction } from "ethers"

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

/**
 * Check if the user is connected to Optimism
 */
export async function isConnectedToOptimism(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    return false
  }

  try {
    // Load ethers dynamically
    const { ethers } = await import("ethers")

    // Create provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)

    // Get network
    const network = await provider.getNetwork()

    // Check if on Optimism (chainId 10)
    return network.chainId === 10
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

    // Load ethers dynamically
    const { ethers } = await import("ethers")

    // Create provider and contract instance
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const bridge = new ethers.Contract(BRIDGE_CONTRACT, BRIDGE_ABI, provider)

    // Check if the chain has a mapping
    const lzId = await bridge.chainToLzId(destinationChainId)

    // If lzId is 0, the chain is not supported
    return !lzId.isZero()
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

    // Load ethers dynamically
    const { ethers } = await import("ethers")

    // Create provider and contract instance
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const bridge = new ethers.Contract(BRIDGE_CONTRACT, BRIDGE_ABI, provider)

    // Format address
    const formattedAddress = ethers.utils.getAddress(recipientAddress)

    // Convert amount to wei
    const amountWei = ethers.utils.parseEther(amount)

    // Get fee estimate
    const feeWei = await bridge.estimateFee(destinationChainId, formattedAddress, amountWei)

    // Convert to ETH and add 10% buffer
    const feeEth = ethers.utils.formatEther(feeWei)
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
 * Bridge ETH using ethers.js
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

    // Load ethers dynamically
    const { ethers } = await import("ethers")

    // Create provider
    const provider = new ethers.providers.Web3Provider(window.ethereum)

    // Request account access
    await provider.send("eth_requestAccounts", [])

    // Get signer
    const signer = provider.getSigner()
    const account = await signer.getAddress()

    // Check if on Optimism
    const network = await provider.getNetwork()
    if (network.chainId !== 10) {
      throw new Error("Please connect to Optimism network")
    }

    // Create contract instance
    const bridge = new ethers.Contract(BRIDGE_CONTRACT, BRIDGE_ABI, signer)

    // Format address
    const formattedAddress = ethers.utils.getAddress(recipientAddress)

    // Verify the chain is supported
    const lzId = await bridge.chainToLzId(destinationChainId)
    if (lzId.isZero()) {
      throw new Error(`Destination chain ${destinationChainId} is not supported`)
    }

    // Use a minimal test amount for safety
    const testAmount = "0.0001" // 0.0001 ETH
    console.log(`Using test amount: ${testAmount} ETH instead of ${amount} ETH for safety`)

    // Get fee estimate
    const feeResult = await getBridgeFee(destinationChainId, formattedAddress, testAmount)
    if (!feeResult.success || !feeResult.fee) {
      throw new Error("Failed to estimate fee")
    }

    // Calculate total amount (amount + fee)
    const totalEth = Number.parseFloat(testAmount) + Number.parseFloat(feeResult.fee)
    const totalWei = ethers.utils.parseEther(totalEth.toString())

    console.log("Bridging details:", {
      from: account,
      to: formattedAddress,
      destinationChain: destinationChainId,
      amount: testAmount + " ETH",
      fee: feeResult.fee + " ETH",
      total: totalEth.toFixed(6) + " ETH",
    })

    // Estimate gas
    let gasEstimate: BigNumber
    try {
      gasEstimate = await bridge.estimateGas.bridgeNative(destinationChainId, formattedAddress, {
        value: totalWei,
      })
      console.log("Gas estimate:", gasEstimate.toString())
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
            recipient: formattedAddress,
            value: totalWei.toString(),
          },
        },
      }
    }

    // Execute bridge transaction with higher gas limit
    const tx: ContractTransaction = await bridge.bridgeNative(destinationChainId, formattedAddress, {
      value: totalWei,
      gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
    })

    console.log("Transaction submitted:", tx.hash)

    // Save transaction to history
    saveTransaction({
      hash: tx.hash,
      from: account,
      destinationChainId,
      amount: testAmount,
      fee: feeResult.fee,
      timestamp: Date.now(),
      status: "pending",
    })

    return {
      success: true,
      txHash: tx.hash,
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
