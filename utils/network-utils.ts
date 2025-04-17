/**
 * Utility functions for network detection and management
 */

// Optimism chain ID
export const OPTIMISM_CHAIN_ID = 10
export const OPTIMISM_CHAIN_ID_HEX = "0xA"

/**
 * Check if the user is connected to Optimism
 * Uses multiple methods to verify for maximum reliability
 */
export async function isConnectedToOptimism(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) {
    return false
  }

  try {
    // Method 1: Direct provider request
    const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
    const chainId = Number.parseInt(chainIdHex, 16)
    console.log("Chain ID from direct provider request:", chainId, "Hex:", chainIdHex)

    if (chainId === OPTIMISM_CHAIN_ID) {
      console.log("✅ Connected to Optimism (chainId: 10)")
      return true
    }

    // Method 2: Try using Web3 if available
    if (typeof window !== "undefined") {
      try {
        const Web3Module = await import("web3")
        // Handle both default export styles
        const Web3 = Web3Module.default || Web3Module
        const web3 = new Web3(window.ethereum)
        const web3ChainId = await web3.eth.getChainId()
        console.log("Chain ID from Web3:", web3ChainId)

        if (web3ChainId === OPTIMISM_CHAIN_ID) {
          console.log("✅ Connected to Optimism (Web3 chainId: 10)")
          return true
        }
      } catch (web3Error) {
        console.warn("Web3 check failed:", web3Error)
        // Continue with other methods
      }
    }

    // Method 3: Check network version (older method)
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
    return false
  }

  try {
    // Try to switch to Optimism
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: OPTIMISM_CHAIN_ID_HEX }],
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
              chainId: OPTIMISM_CHAIN_ID_HEX,
              chainName: "Optimism",
              nativeCurrency: {
                name: "Ethereum",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["https://mainnet.optimism.io", "https://optimism-mainnet.public.blastapi.io"],
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
