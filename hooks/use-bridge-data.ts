"use client"

import { useState, useEffect } from "react"
import { useWallet, useBalance } from "@/providers/wallet-provider"

export type Chain = {
  id: string
  name: string
  logo: string
  chainId: number
}

export type Token = {
  id: string
  name: string
  logo: string
  decimals: number
  addresses: Record<string, string> // chainId -> token address
}

// Chain data with chainIds
const chains: Chain[] = [
  { id: "ethereum", name: "Ethereum", logo: "🔷", chainId: 1 },
  { id: "arbitrum", name: "Arbitrum", logo: "🔶", chainId: 42161 },
  { id: "optimism", name: "Optimism", logo: "🔴", chainId: 10 },
  { id: "polygon", name: "Polygon", logo: "🟣", chainId: 137 },
  { id: "base", name: "Base", logo: "🔵", chainId: 8453 },
]

// Token data with addresses on different chains
const tokens: Token[] = [
  {
    id: "eth",
    name: "ETH",
    logo: "⟠",
    decimals: 18,
    addresses: {
      "1": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH
      "42161": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH on Arbitrum
      "10": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH on Optimism
      "137": "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH on Polygon
      "8453": "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH on Base
    },
  },
  {
    id: "usdc",
    name: "USDC",
    logo: "💲",
    decimals: 6,
    addresses: {
      "1": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
      "42161": "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC on Arbitrum
      "10": "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // USDC on Optimism
      "137": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC on Polygon
      "8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    },
  },
  {
    id: "usdt",
    name: "USDT",
    logo: "💵",
    decimals: 6,
    addresses: {
      "1": "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT on Ethereum
      "42161": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT on Arbitrum
      "10": "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // USDT on Optimism
      "137": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT on Polygon
      "8453": "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", // USDT on Base
    },
  },
  {
    id: "dai",
    name: "DAI",
    logo: "🔶",
    decimals: 18,
    addresses: {
      "1": "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI on Ethereum
      "42161": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI on Arbitrum
      "10": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI on Optimism
      "137": "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // DAI on Polygon
      "8453": "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", // DAI on Base
    },
  },
]

export function useBridgeData() {
  const { chainId, address, isConnected } = useWallet()
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [sourceChain, setSourceChain] = useState<Chain | null>(null)
  const [destChain, setDestChain] = useState<Chain | null>(null)

  // Set source chain based on connected network
  useEffect(() => {
    if (chainId) {
      const matchedChain = chains.find((c) => c.chainId === chainId)
      if (matchedChain) {
        setSourceChain(matchedChain)
      }
    }
  }, [chainId])

  // Get balance for selected token on source chain
  const { data: balance } = useBalance({
    address: isConnected ? address : undefined,
    token: selectedToken?.id,
    chainId: sourceChain?.chainId,
  })

  // Calculate max amount user can bridge
  const maxAmount = balance ? balance.formatted : "0"

  return {
    chains,
    tokens,
    selectedToken,
    setSelectedToken,
    sourceChain,
    setSourceChain,
    destChain,
    setDestChain,
    balance,
    maxAmount,
  }
}
