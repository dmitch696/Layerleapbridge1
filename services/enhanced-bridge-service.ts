import { CONTRACT_ADDRESSES, BRIDGE_ABI } from "@/config/contracts"

// Local storage key for transaction history
const TX_HISTORY_KEY = "layerleap_bridge_transactions"

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
    // Method 1: Direct provider request
    const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
    const chainId = Number.parseInt(chainIdHex, 16)
    console.log("Chain ID from direct provider request:", chainId)

    if (chainId === 10) {
      return true
    }

    // Method 2: Try using Web3 if available
    if (typeof window !== "undefined") {
      try {
        const Web3 = (await import("web3")).default
        const web3 = new Web3(window.ethereum)
        const web3ChainId = await web3.eth.getChainId()
        console.log("Chain ID from Web3:", web3ChainId)

        if (web3ChainId === 10) {
          return true
        }
      } catch (web3Error) {
        console.warn("Web3 check failed:", web3Error)
        // Continue with other methods
      }
    }

    return false
  } catch (error) {
    console.error("Error checking Optimism connection:", error)
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
              rpcUrls: ["https://mainnet.optimism.io"],
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
 * Check if the destination chain is supported
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

    // Check if the chain is supported by checking if it has a mapping
    const lzId = await bridge.methods.chainToLzId(destinationChainId).call()
    console.log(`Chain ${destinationChainId} has LayerZero ID: ${lzId}`)

    // If lzId is 0, the chain is not supported
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
      throw new Error("MetaMask is not installed")
    }

    const Web3 = (await import("web3")).default
    const web3 = new Web3(window.ethereum)

    // Create contract instance
    const bridge = new web3.eth.Contract(BRIDGE_ABI as any, CONTRACT_ADDRESSES.LAYER_ZERO_BRIDGE)

    // Format the recipient address properly
    const formattedRecipientAddress = recipientAddress.startsWith("0x") ? recipientAddress : `0x${recipientAddress}`

    // Convert amount to wei
    const amountWei = web3.utils.toWei(amount, "ether")

    // Get fee estimate
    const feeWei = await bridge.methods.estimateFee(destinationChainId, formattedRecipientAddress, amountWei).call()

    // Add a 10% buffer to the fee - using BN.js directly instead of toBN
    const BN = web3.utils.BN
    const feeWithBuffer = new BN(feeWei).muln(110).divn(100)
    const feeInEth = web3.utils.fromWei(feeWithBuffer.toString(), "ether")

    return {
      success: true,
      fee: feeInEth,
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
 * Bridge ETH via LayerZero
 */
export async function bridgeETH(
  destinationChainId: number,
  recipientAddress: string,
  amount: string,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to use this feature.")
    }

    // Request account access if needed
    await window.ethereum.request({ method: "eth_requestAccounts" })

    // We'll use the window.ethereum provider directly with Web3
    const Web3 = (await import("web3")).default
    const web3 = new Web3(window.ethereum)

    // Get BN directly from web3.utils
    const BN = web3.utils.BN

    // Check if user is on Optimism
    let chainId
    try {
      // Try multiple methods to get the chain ID
      chainId = await web3.eth.getChainId()
      console.log("Chain ID from web3:", chainId)

      // Also check directly from provider as backup
      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
      const providerChainId = Number.parseInt(chainIdHex, 16)
      console.log("Chain ID from provider:", providerChainId)

      // Use the provider chain ID if web3 chain ID doesn't match Optimism
      if (chainId !== 10 && providerChainId === 10) {
        console.log("Using provider chain ID instead")
        chainId = providerChainId
      }

      if (chainId !== 10) {
        throw new Error("Please connect to Optimism network in MetaMask to use this bridge.")
      }
    } catch (error) {
      console.error("Error checking chain ID:", error)
      throw new Error("Failed to verify network. Please ensure you're connected to Optimism.")
    }

    // Check if the destination chain is supported
    const isSupported = await isChainSupported(destinationChainId)
    if (!isSupported) {
      throw new Error(`Destination chain ${destinationChainId} is not supported by the bridge contract.`)
    }

    // Get current account
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]

    // Create contract instance
    const bridge = new web3.eth.Contract(BRIDGE_ABI as any, CONTRACT_ADDRESSES.LAYER_ZERO_BRIDGE)

    // Format the recipient address properly
    const formattedRecipientAddress = recipientAddress.startsWith("0x") ? recipientAddress : `0x${recipientAddress}`
    console.log("Formatted recipient address:", formattedRecipientAddress)

    // Convert amount to wei
    const amountWei = web3.utils.toWei(amount, "ether")

    // Get fee estimate
    const feeWei = await bridge.methods.estimateFee(destinationChainId, formattedRecipientAddress, amountWei).call()

    console.log(`Estimated fee: ${web3.utils.fromWei(feeWei, "ether")} ETH`)

    // Add a buffer to the fee to account for potential gas price fluctuations (10% extra)
    const feeBN = new BN(feeWei)
    const feeWithBuffer = feeBN.muln(110).divn(100)
    const feeWithBufferStr = feeWithBuffer.toString()
    console.log(`Fee with 10% buffer: ${web3.utils.fromWei(feeWithBufferStr, "ether")} ETH`)

    // Calculate total amount (amount to bridge + fee)
    const amountBN = new BN(amountWei)
    const totalValue = amountBN.add(feeWithBuffer).toString()
    console.log("Amount Wei:", amountWei)
    console.log("Fee Wei with buffer:", feeWithBufferStr)
    console.log("Total Value:", totalValue)
    console.log("Total Value in ETH:", web3.utils.fromWei(totalValue, "ether"))

    // Estimate gas for the transaction
    try {
      const gasEstimate = await bridge.methods.bridgeNative(destinationChainId, formattedRecipientAddress).estimateGas({
        from: account,
        value: totalValue,
      })
      console.log("Estimated gas:", gasEstimate)
    } catch (gasError) {
      console.error("Gas estimation failed:", gasError)
      // Continue anyway, but log the error
    }

    // Execute bridge transaction with higher gas limit to ensure it goes through
    const tx = await bridge.methods.bridgeNative(destinationChainId, formattedRecipientAddress).send({
      from: account,
      value: totalValue,
      gas: 300000, // Set a higher gas limit
    })

    console.log(`Transaction submitted: ${tx.transactionHash}`)
    console.log(
      "Transaction details:",
      JSON.stringify({
        hash: tx.transactionHash,
        blockNumber: tx.blockNumber,
        from: tx.from,
        to: tx.to,
        status: tx.status,
      }),
    )

    // Save transaction to history
    saveTransaction({
      hash: tx.transactionHash,
      from: account,
      destinationChainId,
      amount,
      fee: web3.utils.fromWei(feeWithBufferStr, "ether"),
      timestamp: Date.now(),
      status: "pending",
    })

    return {
      success: true,
      txHash: tx.transactionHash,
    }
  } catch (error: any) {
    console.error("Bridge error:", error)

    // Extract more detailed error information if available
    let errorMessage = error.message

    if (error.receipt) {
      errorMessage += ` - Transaction reverted. Receipt: ${JSON.stringify(error.receipt)}`
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Save transaction to local storage
 */
function saveTransaction(tx: BridgeTransaction): void {
  try {
    // Get existing transactions
    const existingTxs = getTransactionHistory()

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

/**
 * Update transaction status
 */
export function updateTransactionStatus(txHash: string, status: "pending" | "completed" | "failed"): void {
  try {
    // Get existing transactions
    const existingTxs = getTransactionHistory()

    // Find and update the transaction
    const updatedTxs = existingTxs.map((tx) => {
      if (tx.hash === txHash) {
        return { ...tx, status }
      }
      return tx
    })

    // Save to local storage
    localStorage.setItem(TX_HISTORY_KEY, JSON.stringify(updatedTxs))
  } catch (error) {
    console.error("Error updating transaction status:", error)
  }
}

// Add TypeScript support for window.ethereum
declare global {
  interface Window {
    ethereum: any
  }
}
