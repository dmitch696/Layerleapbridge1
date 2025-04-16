// Import ethers dynamically to avoid SSR issues
let ethers: any

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
]

// Helper function to ensure ethers is loaded
async function getEthers() {
  if (!ethers) {
    // Only import ethers on the client side
    if (typeof window !== "undefined") {
      ethers = await import("ethers")
    } else {
      throw new Error("Ethers can only be loaded in browser environment")
    }
  }
  return ethers
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

    // Load ethers
    const ethersLib = await getEthers()

    // Request account access if needed
    await window.ethereum.request({ method: "eth_requestAccounts" })

    // Create provider and signer
    const provider = new ethersLib.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()

    // Check if user is on Optimism
    const network = await provider.getNetwork()
    if (network.chainId !== 10) {
      throw new Error("Please connect to Optimism network in MetaMask to use this bridge.")
    }

    // Create contract instance
    const bridge = new ethersLib.Contract(BRIDGE_ADDRESS, BRIDGE_ABI, signer)

    // Convert amount to wei
    const amountWei = ethersLib.utils.parseEther(amount)

    // Get fee estimate
    const feeWei = await bridge.estimateFee(destinationChainId, recipientAddress, amountWei)

    console.log(`Estimated fee: ${ethersLib.utils.formatEther(feeWei)} ETH`)

    // Calculate total amount (amount to bridge + fee)
    const totalValue = amountWei.add(feeWei)

    // Execute bridge transaction
    const tx = await bridge.bridgeNative(destinationChainId, recipientAddress, { value: totalValue })

    console.log(`Transaction submitted: ${tx.hash}`)

    // Wait for transaction to be mined
    const receipt = await tx.wait()

    console.log(`Transaction confirmed in block ${receipt.blockNumber}`)

    return {
      success: true,
      txHash: tx.hash,
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

    // Load ethers
    const ethersLib = await getEthers()

    const provider = new ethersLib.providers.Web3Provider(window.ethereum)
    const bridge = new ethersLib.Contract(BRIDGE_ADDRESS, BRIDGE_ABI, provider)

    const amountWei = ethersLib.utils.parseEther(amount)
    const feeWei = await bridge.estimateFee(destinationChainId, recipientAddress, amountWei)

    return {
      success: true,
      fee: ethersLib.utils.formatEther(feeWei),
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
