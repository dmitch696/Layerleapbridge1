// Chain IDs for reference
export const CHAIN_IDS = {
  ETHEREUM: 1,
  OPTIMISM: 10,
  ARBITRUM: 42161,
  POLYGON: 137,
  BASE: 8453,
  AVALANCHE: 43114,
}

// Chain data for UI
export const CHAINS = [
  { id: 1, name: "Ethereum", logo: "🔷" },
  { id: 42161, name: "Arbitrum", logo: "🔶" },
  { id: 137, name: "Polygon", logo: "🟣" },
  { id: 8453, name: "Base", logo: "🔵" },
  { id: 43114, name: "Avalanche", logo: "❄️" },
]

// Your deployed contract address on Optimism
const BRIDGE_ADDRESS = "0x29fc5F35D9c50c6DDB3eE4D8cF7d40D7055e4336"

// ABI for the contract (minimal version for what we need)
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
  // Add a function to check if the chain is supported
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "chainToLzId",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function",
  },
]

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
    const bridge = new web3.eth.Contract(BRIDGE_ABI as any, BRIDGE_ADDRESS)

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
 * Bridge ETH via LayerZero
 */
export async function bridgeViaLayerZero(
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
    const bridge = new web3.eth.Contract(BRIDGE_ABI as any, BRIDGE_ADDRESS)

    // Convert amount to wei
    const amountWei = web3.utils.toWei(amount, "ether")

    // Get fee estimate
    const feeWei = await bridge.methods.estimateFee(destinationChainId, recipientAddress, amountWei).call()

    console.log(`Estimated fee: ${web3.utils.fromWei(feeWei, "ether")} ETH`)

    // Add a buffer to the fee to account for potential gas price fluctuations (10% extra)
    const feeWithBuffer = ((BigInt(feeWei) * BigInt(110)) / BigInt(100)).toString()
    console.log(`Fee with 10% buffer: ${web3.utils.fromWei(feeWithBuffer, "ether")} ETH`)

    // Calculate total amount (amount to bridge + fee)
    const totalValue = (BigInt(amountWei) + BigInt(feeWithBuffer)).toString()
    console.log("Amount Wei:", amountWei)
    console.log("Fee Wei with buffer:", feeWithBuffer)
    console.log("Total Value:", totalValue)
    console.log("Total Value in ETH:", web3.utils.fromWei(totalValue, "ether"))

    // Estimate gas for the transaction
    try {
      const gasEstimate = await bridge.methods.bridgeNative(destinationChainId, recipientAddress).estimateGas({
        from: account,
        value: totalValue,
      })
      console.log("Estimated gas:", gasEstimate)
    } catch (gasError) {
      console.error("Gas estimation failed:", gasError)
      // Continue anyway, but log the error
    }

    // Execute bridge transaction with higher gas limit to ensure it goes through
    const tx = await bridge.methods.bridgeNative(destinationChainId, recipientAddress).send({
      from: account,
      value: totalValue,
      gas: 300000, // Set a higher gas limit
    })

    console.log(`Transaction submitted: ${tx.transactionHash}`)
    console.log("Transaction details:", tx)

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
 * Get fee estimate for bridging
 */
export async function getLayerZeroBridgeFee(
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
    const bridge = new web3.eth.Contract(BRIDGE_ABI as any, BRIDGE_ADDRESS)

    // Convert amount to wei
    const amountWei = web3.utils.toWei(amount, "ether")

    // Get fee estimate
    const feeWei = await bridge.methods.estimateFee(destinationChainId, recipientAddress, amountWei).call()

    // Add a 10% buffer to the fee
    const feeWithBuffer = ((BigInt(feeWei) * BigInt(110)) / BigInt(100)).toString()
    const feeInEth = web3.utils.fromWei(feeWithBuffer, "ether")

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

// Add TypeScript support for window.ethereum
declare global {
  interface Window {
    ethereum: any
  }
}
