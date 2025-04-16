import { ethers } from "ethers"
import layerZeroBridgeABI from "../lib/layerZeroBridgeABI.json"

// Your deployed contract address on Optimism
const BRIDGE_ADDRESS = "0x29fc5F35D9c50c6DDB3eE4D8cF7d40D7055e4336"

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

/**
 * Bridge ETH via LayerZero
 * @param {number} destinationChainId - The destination chain ID (e.g., 1 for Ethereum)
 * @param {string} recipientAddress - The recipient address on the destination chain
 * @param {string} amount - The amount to bridge in ETH (e.g., "0.01")
 * @returns {Promise<{success: boolean, txHash?: string, error?: string}>}
 */
export async function bridgeViaLayerZero(
  destinationChainId: number,
  recipientAddress: string,
  amount: string,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Check if MetaMask is installed
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed. Please install MetaMask to use this feature.")
    }

    // Request account access if needed
    await window.ethereum.request({ method: "eth_requestAccounts" })

    // Create provider and signer
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()

    // Check if user is on Optimism
    const network = await provider.getNetwork()
    if (network.chainId !== 10) {
      throw new Error("Please connect to Optimism network in MetaMask to use this bridge.")
    }

    // Create contract instance
    const bridge = new ethers.Contract(BRIDGE_ADDRESS, layerZeroBridgeABI, signer)

    // Convert amount to wei
    const amountWei = ethers.utils.parseEther(amount)

    // Get fee estimate
    const feeWei = await bridge.estimateFee(destinationChainId, recipientAddress, amountWei)

    console.log(`Estimated fee: ${ethers.utils.formatEther(feeWei)} ETH`)

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
 * @param {number} destinationChainId - The destination chain ID
 * @param {string} recipientAddress - The recipient address
 * @param {string} amount - The amount to bridge in ETH
 * @returns {Promise<{success: boolean, fee?: string, error?: string}>}
 */
export async function getLayerZeroBridgeFee(
  destinationChainId: number,
  recipientAddress: string,
  amount: string,
): Promise<{ success: boolean; fee?: string; error?: string }> {
  try {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed")
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const bridge = new ethers.Contract(BRIDGE_ADDRESS, layerZeroBridgeABI, provider)

    const amountWei = ethers.utils.parseEther(amount)
    const feeWei = await bridge.estimateFee(destinationChainId, recipientAddress, amountWei)

    return {
      success: true,
      fee: ethers.utils.formatEther(feeWei),
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
