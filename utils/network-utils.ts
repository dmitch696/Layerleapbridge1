/**
 * Utility functions for network detection and management
 */

// Optimism chain ID
export const OPTIMISM_CHAIN_ID = 10
export const OPTIMISM_CHAIN_ID_HEX = "0xA"

const CHAIN_DATA: { [chainId: number]: { blockExplorer: string } } = {
  10: { blockExplorer: "https://optimistic.etherscan.io" },
}

/**
 * Check if the user is connected to Optimism
 * Uses multiple methods to verify for maximum reliability
 */
export async function isConnectedToOptimism(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    console.log("MetaMask not available")
    return false
  }

  try {
    // Method 1: Direct provider request - most reliable method
    const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
    const chainId = Number.parseInt(chainIdHex, 16)
    console.log("Chain ID from direct provider request:", chainId, "Hex:", chainIdHex)

    if (chainId === OPTIMISM_CHAIN_ID) {
      console.log("✅ Connected to Optimism (chainId: 10)")
      return true
    }

    // Method 2: Try using Web3.js as fallback if available
    try {
      const Web3 = (await import("web3")).default
      const web3 = new Web3(window.ethereum)
      const web3ChainId = await web3.eth.getChainId()
      console.log("Chain ID from Web3:", web3ChainId)

      if (web3ChainId === OPTIMISM_CHAIN_ID) {
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

      if (networkVersion === OPTIMISM_CHAIN_ID.toString()) {
        console.log("✅ Connected to Optimism (networkVersion: 10)")
        return true
      }
    } catch (versionError) {
      console.error("Error getting network version:", versionError)
    }

    console.log("❌ Not connected to Optimism - detected chain ID:", chainId)
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
    console.log("MetaMask not available")
    return false
  }

  try {
    console.log("Attempting to switch to Optimism network...")
    // Try to switch to Optimism
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: OPTIMISM_CHAIN_ID_HEX }],
    })

    // Wait a moment for the network to switch
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Verify the switch was successful
    const isNowOnOptimism = await isConnectedToOptimism()
    console.log("Switch successful:", isNowOnOptimism)
    return isNowOnOptimism
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        console.log("Optimism network not found. Adding it...")
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: OPTIMISM_CHAIN_ID_HEX,
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

        // Try switching again after adding
        const isNowOnOptimism = await isConnectedToOptimism()
        console.log("Switch after add successful:", isNowOnOptimism)
        return isNowOnOptimism
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
 * Get the explorer URL for a transaction
 * @param chainId The chain ID
 * @param txHash The transaction hash
 * @returns The explorer URL for the transaction
 */
export function getExplorerUrl(chainId: number, txHash: string): string {
  const chainData = CHAIN_DATA[chainId]
  if (!chainData) return ""

  return `${chainData.blockExplorer}/tx/${txHash}`
}
