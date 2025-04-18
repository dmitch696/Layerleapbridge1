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
const BRIDGE_ADDRESS = "0xB84361304A2DBe4707FF7D6E06cE32E0cd05D902"

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
 * Properly format an Ethereum address for LayerZero
 * This ensures the address is in the correct format expected by the protocol
 */
function formatAddressForLayerZero(address: string): string {
  // Make sure the address is properly formatted with 0x prefix
  if (!address.startsWith("0x")) {
    address = "0x" + address
  }

  // Ensure the address is the correct length (42 characters including 0x prefix)
  if (address.length !== 42) {
    throw new Error(`Invalid Ethereum address: ${address}`)
  }

  // Return the properly formatted address
  return address
}

// Update the bridgeViaLayerZero function to match Stargate's parameters

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
      chainId = await web3.eth.getChainId()
      if (chainId !== 10) {
        throw new Error("Please connect to Optimism network in MetaMask to use this bridge.")
      }
    } catch (error) {
      console.error("Error checking chain ID:", error)
      throw new Error("Failed to verify network. Please ensure you're connected to Optimism.")
    }

    // Get current account
    const accounts = await web3.eth.getAccounts()
    const account = accounts[0]

    // Create contract instance
    const bridge = new web3.eth.Contract(BRIDGE_ABI as any, BRIDGE_ADDRESS)

    // Format the recipient address properly for LayerZero
    const formattedRecipientAddress = formatAddressForLayerZero(recipientAddress)
    console.log("Formatted recipient address:", formattedRecipientAddress)

    // Use a smaller test amount like Stargate
    const testAmount = "0.0001" // 0.0001 ETH
    console.log(`Using test amount: ${testAmount} ETH`)

    // Convert amount to wei
    const amountWei = web3.utils.toWei(testAmount, "ether")

    // Use a smaller fee like Stargate (0.000011 ETH)
    const feeEth = "0.000011" // 0.000011 ETH
    const feeWei = web3.utils.toWei(feeEth, "ether")
    console.log(`Using fixed fee: ${feeEth} ETH (${feeWei} wei)`)

    // Calculate total value to send (amount + fee)
    const totalEth = Number(testAmount) + Number(feeEth)
    const totalWei = web3.utils.toWei(totalEth.toString(), "ether")
    console.log(`Total value: ${totalEth} ETH (${totalWei} wei)`)

    // Execute bridge transaction with parameters similar to Stargate
    const tx = await bridge.methods.bridgeNative(destinationChainId, formattedRecipientAddress).send({
      from: account,
      value: totalWei,
      gas: 200000, // Lower gas limit like Stargate
      maxFeePerGas: web3.utils.toWei("0.1", "gwei"), // Lower max fee
      maxPriorityFeePerGas: web3.utils.toWei("0.1", "gwei"), // Lower priority fee
    })

    console.log("Transaction submitted:", tx.transactionHash)

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

    // Format the recipient address properly for LayerZero
    const formattedRecipientAddress = formatAddressForLayerZero(recipientAddress)

    // Convert amount to wei
    const amountWei = web3.utils.toWei(amount, "ether")

    // Get fee estimate
    const feeWei = await bridge.methods.estimateFee(destinationChainId, formattedRecipientAddress, amountWei).call()

    // Add a 10% buffer to the fee - using simple math instead of BN
    const feeETH = Number(web3.utils.fromWei(feeWei, "ether"))
    const feeWithBuffer = (feeETH * 1.1).toFixed(6)

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

// Add TypeScript support for window.ethereum
declare global {
  interface Window {
    ethereum: any
  }
}
