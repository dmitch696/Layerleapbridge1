"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function WalletButton() {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    if (typeof window !== "undefined" && window.ethereum) {
      const checkConnection = async () => {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
            setAddress(accounts[0])
            setIsConnected(true)
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error)
        }
      }

      checkConnection()

      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          setAddress(null)
          setIsConnected(false)
        } else {
          setAddress(accounts[0])
          setIsConnected(true)
        }
      })

      return () => {
        window.ethereum.removeAllListeners("accountsChanged")
      }
    }
  }, [])

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
        }
      } catch (error) {
        console.error("Error connecting wallet:", error)
      }
    } else {
      alert("Please install MetaMask to use this feature")
    }
  }

  const disconnectWallet = () => {
    setAddress(null)
    setIsConnected(false)
  }

  if (!mounted) {
    return (
      <Button variant="outline" className="bg-gray-800 border-gray-700">
        Connect Wallet
      </Button>
    )
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm hidden md:inline-block">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <Button onClick={disconnectWallet} variant="outline" className="bg-gray-800 border-gray-700 hover:bg-gray-700">
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={connectWallet}
      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
    >
      Connect Wallet
    </Button>
  )
}

// Add TypeScript support for window.ethereum
declare global {
  interface Window {
    ethereum: any
  }
}
