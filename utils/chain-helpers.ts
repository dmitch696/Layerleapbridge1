// Chain IDs
export const CHAIN_IDS = {
  ETHEREUM: 1,
  OPTIMISM: 10,
  ARBITRUM: 42161,
  POLYGON: 137,
  BASE: 8453,
  AVALANCHE: 43114,
}

// Chain data
export const CHAIN_DATA = {
  [CHAIN_IDS.ETHEREUM]: {
    name: "Ethereum",
    chainId: "0x1",
    rpcUrl: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    blockExplorer: "https://etherscan.io",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  },
  [CHAIN_IDS.OPTIMISM]: {
    name: "Optimism",
    chainId: "0xA",
    rpcUrl: "https://mainnet.optimism.io",
    blockExplorer: "https://optimistic.etherscan.io",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  },
  [CHAIN_IDS.ARBITRUM]: {
    name: "Arbitrum",
    chainId: "0xA4B1",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  },
  [CHAIN_IDS.POLYGON]: {
    name: "Polygon",
    chainId: "0x89",
    rpcUrl: "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
  },
  [CHAIN_IDS.BASE]: {
    name: "Base",
    chainId: "0x2105",
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
  },
  [CHAIN_IDS.AVALANCHE]: {
    name: "Avalanche",
    chainId: "0xA86A",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    blockExplorer: "https://snowtrace.io",
    nativeCurrency: {
      name: "Avalanche",
      symbol: "AVAX",
      decimals: 18,
    },
  },
}

/**
 * Switch to a specific network in MetaMask
 * @param chainId The chain ID to switch to
 * @returns Promise<boolean> True if successful, false otherwise
 */
export async function switchNetwork(chainId: number): Promise<boolean> {
  if (!window.ethereum) return false

  const chainIdHex = `0x${chainId.toString(16)}`

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    })
    return true
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        const chainData = CHAIN_DATA[chainId]
        if (!chainData) return false

        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainData.chainId,
              chainName: chainData.name,
              nativeCurrency: chainData.nativeCurrency,
              rpcUrls: [chainData.rpcUrl],
              blockExplorerUrls: [chainData.blockExplorer],
            },
          ],
        })
        return true
      } catch (addError) {
        console.error("Error adding network:", addError)
        return false
      }
    }
    console.error("Error switching network:", switchError)
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
