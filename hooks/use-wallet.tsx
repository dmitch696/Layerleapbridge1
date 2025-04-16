import type React from "react"
;('"use client')

import { createContext, useContext, useState, useEffect, useCallback } from "react"

// Define the context type
type WalletContextType = {
  address: string | null
  isConnected: boolean
  chainId: number | null
  connect: () => Promise<void>
  disconnect: () => void
  switchNetwork: (chainId: number) => Promise<boolean>
  isMetaMaskAvailable: boolean
}

// Create the context with default values
const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  chainId: null,
  connect: async () => {},
  disconnect: () => {},
  switchNetwork: async () => false,
  isMetaMaskAvailable: false,
})

// Provider component
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chainId, setChainId] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  // Check if MetaMask is available (only after component is mounted)
  const isMetaMaskAvailable = mounted && typeof window !== "undefined" && window.ethereum !== undefined

  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  // Connect to MetaMask
  const connect = useCallback(async () => {
    if (!isMetaMaskAvailable) {
      console.log("MetaMask not available")
      alert("Please install MetaMask to use this feature")
      return
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

      if (accounts.length > 0) {
        setAddress(accounts[0])
        setIsConnected(true)

        // Get current chain ID
        const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
        setChainId(Number.parseInt(chainIdHex, 16))

        console.log("Connected to MetaMask:", accounts[0])
      }
    } catch (error) {
      console.error("Error connecting to MetaMask:", error)
    }
  }, [isMetaMaskAvailable])

  // Disconnect from MetaMask
  const disconnect = useCallback(() => {
    setAddress(null)
    setIsConnected(false)
    setChainId(null)
  }, [])

  // Switch network
  const switchNetwork = useCallback(
    async (newChainId: number) => {
      if (!isMetaMaskAvailable || !isConnected) return false

      try {
        // Convert chain ID to hexadecimal
        const chainIdHex = `0x${newChainId.toString(16)}`

        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        })

        setChainId(newChainId)
        return true
      } catch (error) {
        console.error("Error switching network:", error)
        return false
      }
    },
    [isMetaMaskAvailable, isConnected],
  )

  // Listen for account and chain changes
  useEffect(() => {
    if (!isMetaMaskAvailable) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnect()
      } else if (accounts[0] !== address) {
        setAddress(accounts[0])
        setIsConnected(true)
      }
    }

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(Number.parseInt(chainIdHex, 16))
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      // Check if already connected
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAddress(accounts[0])
            setIsConnected(true)

            // Get current chain ID
            window.ethereum.request({ method: "eth_chainId" }).then((chainIdHex: string) => {
              setChainId(Number.parseInt(chainIdHex, 16))
            })
          }
        })
        .catch((error: any) => {
          console.error("Error checking accounts:", error)
        })
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [address, disconnect, isMetaMaskAvailable])

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        chainId,
        connect,
        disconnect,
        switchNetwork,
        isMetaMaskAvailable,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

// Hook to use the wallet context
export function useWallet() {
  return useContext(WalletContext)
}

// Add TypeScript support for window.ethereum
declare global {
  interface Window {
    ethereum: any
  }
}
