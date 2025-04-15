"use client"

import { useState, useEffect, useCallback } from "react"

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [chainId, setChainId] = useState<number | null>(1) // Default to Ethereum mainnet
  const [mounted, setMounted] = useState(false)

  // Only run client-side code after mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if MetaMask is available
  const isMetaMaskAvailable = mounted && typeof window !== "undefined" && window.ethereum !== undefined

  // Connect to MetaMask
  const connect = useCallback(
    async (connector?: string) => {
      if (!isMetaMaskAvailable) {
        console.log("MetaMask is not installed")
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
        }
      } catch (error) {
        console.error("Error connecting to MetaMask:", error)
      }
    },
    [isMetaMaskAvailable],
  )

  // Disconnect from MetaMask
  const disconnect = useCallback(() => {
    setAddress(null)
    setIsConnected(false)
    setChainId(1) // Reset to default
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

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskAvailable) return

    try {
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

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      // Check if already connected
      window.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)

          // Get current chain ID
          window.ethereum.request({ method: "eth_chainId" }).then((chainIdHex: string) => {
            setChainId(Number.parseInt(chainIdHex, 16))
          })
        }
      })

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    } catch (error) {
      console.error("Error setting up wallet listeners:", error)
    }
  }, [address, disconnect, isMetaMaskAvailable])

  return {
    address,
    isConnected,
    chainId,
    connect,
    disconnect,
    switchNetwork,
    isMetaMaskAvailable,
  }
}

// Add TypeScript support for window.ethereum
declare global {
  interface Window {
    ethereum: any
  }
}
