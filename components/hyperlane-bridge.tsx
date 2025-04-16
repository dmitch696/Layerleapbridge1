"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useWallet } from "@/hooks/use-wallet"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

// Chain data
const chains = [
  { id: "ethereum", name: "Ethereum", logo: "🔷", chainId: 1 },
  { id: "arbitrum", name: "Arbitrum", logo: "🔶", chainId: 42161 },
  { id: "optimism", name: "Optimism", logo: "🔴", chainId: 10 },
  { id: "polygon", name: "Polygon", logo: "🟣", chainId: 137 },
  { id: "base", name: "Base", logo: "🔵", chainId: 8453 },
]

// Token data
const tokens = [
  { id: "eth", name: "ETH", logo: "⟠" },
  { id: "usdc", name: "USDC", logo: "💲" },
  { id: "usdt", name: "USDT", logo: "💵" },
  { id: "dai", name: "DAI", logo: "🔶" },
]

export default function HyperlaneBridge() {
  const { toast } = useToast()
  const { address, isConnected, connect, chainId, switchNetwork } = useWallet()
  const [protocol, setProtocol] = useState("hyperlane")
  const [sourceChain, setSourceChain] = useState("")
  const [destChain, setDestChain] = useState("")
  const [token, setToken] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  // Set source chain based on connected wallet's network
  useEffect(() => {
    if (chainId) {
      const chain = chains.find((c) => c.chainId === chainId)
      if (chain) {
        setSourceChain(chain.id)
      }
    }
  }, [chainId])

  const handleSwapChains = () => {
    const temp = sourceChain
    setSourceChain(destChain)
    setDestChain(temp)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      await connect()
      return
    }

    if (!sourceChain || !destChain || !token || !amount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    // Validate amount
    const amountNum = Number.parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Check if we need to switch networks
      const sourceChainObj = chains.find((c) => c.id === sourceChain)
      if (sourceChainObj && chainId !== sourceChainObj.chainId) {
        toast({
          title: "Switching Network",
          description: `Switching to ${sourceChainObj.name}...`,
        })

        const switched = await switchNetwork(sourceChainObj.chainId)
        if (!switched) {
          throw new Error("Failed to switch network")
        }
      }

      // Simulate bridge transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate mock transaction hash
      const hash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`

      setTxHash(hash)

      toast({
        title: "Bridge Transaction Submitted",
        description: `Bridging ${amount} ${token.toUpperCase()} from ${sourceChain} to ${destChain}`,
        variant: "default",
      })

      // Reset form
      setAmount("")
    } catch (error) {
      console.error("Bridge error:", error)
      toast({
        title: "Bridge Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="mb-2">Protocol</p>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={protocol === "hyperlane" ? "default" : "outline"}
                onClick={() => setProtocol("hyperlane")}
                className="flex-1"
              >
                Hyperlane
              </Button>
              <Button
                type="button"
                variant={protocol === "layerzero" ? "default" : "outline"}
                onClick={() => setProtocol("layerzero")}
                className="flex-1"
              >
                LayerZero
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceChain">Source Chain</Label>
            <select
              id="sourceChain"
              className="w-full p-2 bg-gray-700 rounded"
              value={sourceChain}
              onChange={(e) => setSourceChain(e.target.value)}
            >
              <option value="">Select source chain</option>
              {chains.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.logo} {chain.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-center">
            <Button type="button" variant="ghost" size="sm" onClick={handleSwapChains}>
              ⇄
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destChain">Destination Chain</Label>
            <select
              id="destChain"
              className="w-full p-2 bg-gray-700 rounded"
              value={destChain}
              onChange={(e) => setDestChain(e.target.value)}
            >
              <option value="">Select destination chain</option>
              {chains.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.logo} {chain.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <select
              id="token"
              className="w-full p-2 bg-gray-700 rounded"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            >
              <option value="">Select token</option>
              {tokens.map((token) => (
                <option key={token.id} value={token.id}>
                  {token.logo} {token.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="text"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-700 border-gray-600"
            />
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Bridge Fee:</span>
              <span>~0.001 ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Estimated Time:</span>
              <span>{protocol === "hyperlane" ? "~15 minutes" : "~10 minutes"}</span>
            </div>
          </div>

          {txHash && (
            <div className="p-3 bg-gray-700 rounded text-sm">
              <p className="font-medium mb-1">Transaction Submitted</p>
              <p className="truncate">
                Hash: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </p>
              {sourceChain && (
                <a
                  href={`https://${
                    sourceChain === "ethereum"
                      ? "etherscan.io"
                      : sourceChain === "optimism"
                        ? "optimistic.etherscan.io"
                        : sourceChain === "arbitrum"
                          ? "arbiscan.io"
                          : sourceChain === "polygon"
                            ? "polygonscan.com"
                            : "basescan.org"
                  }/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-xs"
                >
                  View on Explorer
                </a>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : isConnected ? "Bridge Assets" : "Connect Wallet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
