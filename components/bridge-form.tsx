"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import EthereumLogo from "@/components/logos/ethereum-logo"
import OptimismLogo from "@/components/logos/optimism-logo"
import ArbitrumLogo from "@/components/logos/arbitrum-logo"
import PolygonLogo from "@/components/logos/polygon-logo"
import BaseLogo from "@/components/logos/base-logo"
import AvalancheLogo from "@/components/logos/avalanche-logo"

// Chain data for UI
const CHAINS = [
  { id: 1, name: "Ethereum", logo: EthereumLogo, chainId: 1 },
  { id: 10, name: "Optimism", logo: OptimismLogo, chainId: 10 },
  { id: 42161, name: "Arbitrum", logo: ArbitrumLogo, chainId: 42161 },
  { id: 137, name: "Polygon", logo: PolygonLogo, chainId: 137 },
  { id: 8453, name: "Base", logo: BaseLogo, chainId: 8453 },
  { id: 43114, name: "Avalanche", logo: AvalancheLogo, chainId: 43114 },
]

export default function BridgeForm() {
  const [sourceChain, setSourceChain] = useState("10") // Default to Optimism
  const [destChain, setDestChain] = useState("")
  const [amount, setAmount] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check if wallet is connected
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const checkConnection = async () => {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          setIsConnected(accounts.length > 0)
        } catch (error) {
          console.error("Error checking wallet connection:", error)
        }
      }

      checkConnection()

      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setIsConnected(accounts.length > 0)
      })

      return () => {
        window.ethereum.removeAllListeners("accountsChanged")
      }
    }
  }, [])

  const handleSwapChains = () => {
    const temp = sourceChain
    setSourceChain(destChain)
    setDestChain(temp)
  }

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" })
        setIsConnected(true)
      } catch (error) {
        console.error("Error connecting wallet:", error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      await connectWallet()
      return
    }

    setIsLoading(true)

    // Simulate processing
    setTimeout(() => {
      setIsLoading(false)
      // In a real implementation, this would initiate the bridge transaction
    }, 2000)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold mb-4">Bridge Your Assets</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sourceChain">Source Chain</Label>
          <select
            id="sourceChain"
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md"
            value={sourceChain}
            onChange={(e) => setSourceChain(e.target.value)}
          >
            <option value="">Select source chain</option>
            {CHAINS.map((chain) => {
              const ChainLogo = chain.logo
              return (
                <option key={chain.id} value={chain.id} className="flex items-center">
                  {chain.name}
                </option>
              )
            })}
          </select>
          <div className="mt-2 flex items-center">
            {sourceChain && (
              <div className="flex items-center space-x-2">
                <span>Selected:</span>
                {(() => {
                  const chain = CHAINS.find((c) => c.id.toString() === sourceChain)
                  if (chain) {
                    const ChainLogo = chain.logo
                    return (
                      <>
                        <ChainLogo className="h-6 w-6" />
                        <span>{chain.name}</span>
                      </>
                    )
                  }
                  return null
                })()}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSwapChains}
            className="rounded-full h-8 w-8 p-0 flex items-center justify-center"
          >
            ⇅
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="destChain">Destination Chain</Label>
          <select
            id="destChain"
            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md"
            value={destChain}
            onChange={(e) => setDestChain(e.target.value)}
          >
            <option value="">Select destination chain</option>
            {CHAINS.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center">
            {destChain && (
              <div className="flex items-center space-x-2">
                <span>Selected:</span>
                {(() => {
                  const chain = CHAINS.find((c) => c.id.toString() === destChain)
                  if (chain) {
                    const ChainLogo = chain.logo
                    return (
                      <>
                        <ChainLogo className="h-6 w-6" />
                        <span>{chain.name}</span>
                      </>
                    )
                  }
                  return null
                })()}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="text"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-gray-800 border-gray-700"
          />
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Bridge Fee:</span>
            <span>~0.001 ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Estimated Time:</span>
            <span>~15 minutes</span>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </span>
          ) : isConnected ? (
            "Bridge Assets"
          ) : (
            "Connect Wallet"
          )}
        </Button>
      </form>
    </div>
  )
}
