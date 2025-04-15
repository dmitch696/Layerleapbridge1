"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

// Chain data
const chains = [
  { id: "ethereum", name: "Ethereum", logo: "🔷" },
  { id: "arbitrum", name: "Arbitrum", logo: "🔶" },
  { id: "optimism", name: "Optimism", logo: "🔴" },
  { id: "polygon", name: "Polygon", logo: "🟣" },
  { id: "base", name: "Base", logo: "🔵" },
  { id: "avalanche", name: "Avalanche", logo: "🔺" },
]

// Token data
const tokens = [
  { id: "eth", name: "ETH", logo: "⟠" },
  { id: "usdc", name: "USDC", logo: "💲" },
  { id: "usdt", name: "USDT", logo: "💵" },
  { id: "dai", name: "DAI", logo: "🔶" },
]

export default function HyperlaneBridge() {
  const { addToast } = useToast()
  const [protocol, setProtocol] = useState<"hyperlane" | "layerzero">("hyperlane")
  const [sourceChain, setSourceChain] = useState("")
  const [destChain, setDestChain] = useState("")
  const [token, setToken] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSwapChains = () => {
    const temp = sourceChain
    setSourceChain(destChain)
    setDestChain(temp)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sourceChain || !destChain || !token || !amount) {
      addToast("Please fill in all fields", "error")
      return
    }

    setIsLoading(true)

    try {
      // Simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      addToast(`Bridging ${amount} ${token.toUpperCase()} from ${sourceChain} to ${destChain}`, "success")

      // Reset form
      setAmount("")
    } catch (error) {
      console.error("Bridge error:", error)
      addToast("An error occurred while bridging your assets", "error")
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
            <Select value={sourceChain} onValueChange={setSourceChain}>
              <SelectTrigger id="sourceChain">
                <SelectValue placeholder="Select source chain" />
              </SelectTrigger>
              <SelectContent>
                {chains.map((chain) => (
                  <SelectItem key={chain.id} value={chain.id}>
                    <div className="flex items-center">
                      <span className="mr-2">{chain.logo}</span>
                      <span>{chain.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center">
            <Button type="button" variant="ghost" size="icon" onClick={handleSwapChains}>
              ⇄
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destChain">Destination Chain</Label>
            <Select value={destChain} onValueChange={setDestChain}>
              <SelectTrigger id="destChain">
                <SelectValue placeholder="Select destination chain" />
              </SelectTrigger>
              <SelectContent>
                {chains.map((chain) => (
                  <SelectItem key={chain.id} value={chain.id}>
                    <div className="flex items-center">
                      <span className="mr-2">{chain.logo}</span>
                      <span>{chain.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <Select value={token} onValueChange={setToken}>
              <SelectTrigger id="token">
                <SelectValue placeholder="Select token" />
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem key={token.id} value={token.id}>
                    <div className="flex items-center">
                      <span className="mr-2">{token.logo}</span>
                      <span>{token.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Processing..." : "Connect Wallet to Bridge"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
