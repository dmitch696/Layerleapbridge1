// This service directly calls the LayerZero endpoint with the same parameters as Stargate

// Add these import statements at the top of the file
import Web3 from "web3"

// Chain data for UI with LayerZero chain IDs (these match Stargate's chain IDs)
export const CHAINS = [
  { id: 1, name: "Ethereum", logo: "🔷", lzChainId: 101 },
  { id: 42161, name: "Arbitrum", logo: "🔶", lzChainId: 110 },
  { id: 137, name: "Polygon", logo: "🟣", lzChainId: 109 },
  { id: 8453, name: "Base", logo: "🔵", lzChainId: 184 },
  { id: 43114, name: "Avalanche", logo: "❄️", lzChainId: 106 },
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

// LayerZero Endpoint address on Optimism (this is the actual address Stargate uses)
const LZ_ENDPOINT_ADDRESS = "0x3c2269811836af69497E5F486A85D7316753cf62"

// Stargate Router address on Optimism
const STARGATE_ROUTER_ADDRESS = "0xB0D502E938ed5f4df2E681fE6E419ff29631d62b"

// Minimal ABI for the LayerZero Endpoint (only what we need)
const LZ_ENDPOINT_ABI = [
  {
    inputs: [
      { internalType: "uint16", name: "_dstChainId", type: "uint16" },
      { internalType: "bytes", name: "_destination", type: "bytes" },
      { internalType: "bytes", name: "_payload", type: "bytes" },
      { internalType: "address payable", name: "_refundAddress", type: "address" },
      { internalType: "address", name: "_zroPaymentAddress", type: "address" },
      { internalType: "bytes", name: "_adapterParams", type: "bytes" },
    ],
    name: "send",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint16", name: "_dstChainId", type: "uint16" },
      { internalType: "bytes", name: "_destination", type: "bytes" },
      { internalType: "bytes", name: "_payload", type: "bytes" },
      { internalType: "address payable", name: "_refundAddress", type: "address" },
      { internalType: "address", name: "_zroPaymentAddress", type: "address" },
      { internalType: "bytes", name: "_adapterParams", type: "bytes" },
    ],
    name: "estimateFees",
    outputs: [
      { internalType: "uint256", name: "nativeFee", type: "uint256" },
      { internalType: "uint256", name: "zroFee", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
]

// Update the isConnectedToOptimism function to be more robust
/**
 * Check if the user is connected to Optimism
 */
export async function isConnectedToOptimism(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    return false
  }

  try {
    // Method 1: Direct provider request - most reliable method
    const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
    const chainId = Number.parseInt(chainIdHex, 16)
    console.log("Chain ID from direct provider request:", chainId, "Hex:", chainIdHex)

    if (chainId === 10) {
      console.log("✅ Connected to Optimism (chainId: 10)")
      return true
    }

    // Method 2: Try using Web3.js as fallback if available
    try {
      const web3 = new Web3(window.ethereum)
      const web3ChainId = await web3.eth.getChainId()
      console.log("Chain ID from Web3:", web3ChainId)

      if (web3ChainId === 10) {
        console.log("✅ Connected to Optimism (Web3 chainId: 10)")
        return true
      }
    } catch (web3Error) {
      console.warn("Web3 check failed:", web3Error)
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
