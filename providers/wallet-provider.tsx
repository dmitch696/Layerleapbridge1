"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type WalletContextType = {
  address: string | null
  isConnected: boolean
  connect: (connector?: string) => Promise<void>
  disconnect: () => void
  chainId: number
  switchChain: (chainId: number) => Promise<void>
  signer: any
}

const defaultContext: WalletContextType = {
  address: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
  chainId: 1, // Default to Ethereum mainnet
  switchChain: async () => {},
  signer: null,
}

const WalletContext = createContext<WalletContextType>(defaultContext)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chainId, setChainId] = useState(1) // Default to Ethereum mainnet
  const [signer, setSigner] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  // Only run client-side code after mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Connect function with error handling
  const connect = async (connector?: string) => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        console.log("MetaMask not available")
        return
      }

      // Generate a mock address for preview
      const mockAddress = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`

      setAddress(mockAddress)
      setIsConnected(true)
      setSigner({
        address: mockAddress,
        signMessage: async (message: string) =>
          `0x${Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        sendTransaction: async (tx: any) => ({
          hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
        }),
      })
    } catch (error) {
      console.error("Error connecting wallet:", error)
    }
  }

  const disconnect = () => {
    setAddress(null)
    setIsConnected(false)
    setSigner(null)
  }

  const switchChain = async (newChainId: number) => {
    try {
      // Simulate network switching delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      setChainId(newChainId)
      return true
    } catch (error) {
      console.error("Error switching chain:", error)
      return false
    }
  }

  // Don't render provider functionality until mounted (client-side)
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <WalletContext.Provider value={{ address, isConnected, connect, disconnect, chainId, switchChain, signer }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  return useContext(WalletContext)
}

// Helper hook to get balance with error handling
export function useBalance({ chainId, address, token }: { chainId?: number; address?: string; token?: string }) {
  const [balance, setBalance] = useState("0")

  useEffect(() => {
    if (address && chainId) {
      try {
        // Generate a random balance for preview
        const randomBalance = (Math.random() * 9.9 + 0.1).toFixed(6)
        setBalance(randomBalance)
      } catch (error) {
        console.error("Error getting balance:", error)
        setBalance("0")
      }
    }
  }, [address, chainId, token])

  return {
    data: {
      value: BigInt(Math.floor(Number.parseFloat(balance) * 1e18)),
      decimals: 18,
      formatted: balance,
    },
  }
}

// Chain switching hook with error handling
export function useSwitchNetwork() {
  const { switchChain } = useWallet()

  return {
    switchNetwork: switchChain,
    isLoading: false,
    pendingChainId: undefined,
  }
}
