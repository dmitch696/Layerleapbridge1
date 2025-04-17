"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ExternalLink } from "lucide-react"
import { isConnectedToOptimism, switchToOptimism } from "@/utils/network-utils"

// Chain data for UI
const CHAINS = [
  { id: 1, name: "Ethereum", logo: "🔷", stargateId: "1" },
  { id: 42161, name: "Arbitrum", logo: "🔶", stargateId: "110" },
  { id: 137, name: "Polygon", logo: "🟣", stargateId: "109" },
  { id: 8453, name: "Base", logo: "🔵", stargateId: "184" },
  { id: 43114, name: "Avalanche", logo: "❄️", stargateId: "106" },
]

export default function StargateBridge() {
  const { toast } = useToast()
  const [destinationChain, setDestinationChain] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isOnOptimism, setIsOnOptimism] = useState(false)
  const [stargateUrl, setStargateUrl] = useState<string | null>(null)

  // Check if wallet is connected and on the right network
  useEffect(() => {
    async function checkConnection() {
      setIsCheckingNetwork(true)

      if (window.ethereum) {
        try {
          // Check if connected
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          const connected = accounts.length > 0
          setIsConnected(connected)

          if (connected) {
            // Check if on Optimism
            const onOptimism = await isConnectedToOptimism()
            setIsOnOptimism(onOptimism)
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error)
        }
      }

      setIsCheckingNetwork(false)
    }

    checkConnection()

    // Set up event listeners for account and chain changes
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        setIsConnected(accounts.length > 0)
        if (accounts.length > 0) {
          const onOptimism = await isConnectedToOptimism()
          setIsOnOptimism(onOptimism)
        } else {
          setIsOnOptimism(false)
        }
      }

      const handleChainChanged = async () => {
        const onOptimism = await isConnectedToOptimism()
        setIsOnOptimism(onOptimism)
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      // Cleanup
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to use this feature.",
        variant: "destructive",
      })
      return
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" })
      const accounts = await window.ethereum.request({ method: "eth_accounts" })
      setIsConnected(accounts.length > 0)

      if (accounts.length > 0) {
        const onOptimism = await isConnectedToOptimism()
        setIsOnOptimism(onOptimism)
      }

      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setStargateUrl(null)

    try {
      // Check if connected
      if (!isConnected) {
        await connectWallet()
        setIsLoading(false)
        return
      }

      // Check if on Optimism
      if (!isOnOptimism) {
        toast({
          title: "Wrong Network",
          description: "Switching to Optimism network...",
        })

        const switched = await switchToOptimism()
        if (!switched) {
          toast({
            title: "Network Switch Failed",
            description: "Could not switch to Optimism network. Please try manually switching in your wallet.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        setIsOnOptimism(true)
      }

      // Validate inputs
      if (!destinationChain || !amount) {
        toast({
          title: "Missing Information",
          description: "Please select a destination chain and enter an amount.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const amountNum = Number.parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid amount greater than 0.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Find the selected chain
      const selectedChain = CHAINS.find((chain) => chain.id.toString() === destinationChain)
      if (!selectedChain) {
        toast({
          title: "Invalid Chain",
          description: "Please select a valid destination chain.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Construct Stargate URL
      const url = new URL("https://stargate.finance/transfer")

      // Add query parameters
      url.searchParams.append("srcChainId", "111") // Optimism in Stargate format
      url.searchParams.append("dstChainId", selectedChain.stargateId)
      url.searchParams.append("srcToken", "ETH") // Use ETH as source token
      url.searchParams.append("dstToken", "ETH") // Use ETH as destination token
      url.searchParams.append("amount", amount)

      // Set the URL for the redirect button
      setStargateUrl(url.toString())

      toast({
        title: "Bridge Ready",
        description: "Click the button below to continue to Stargate Finance.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl">Bridge via Stargate Finance</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-blue-900/30 rounded mb-4">
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-medium">Source:</span>
              <span className="flex items-center gap-1">
                <span>🔴</span>
                <span>Optimism</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              This will redirect you to Stargate Finance to complete your bridge transaction
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destinationChain">Destination Chain</Label>
            <select
              id="destinationChain"
              className="w-full p-2 bg-gray-700 rounded"
              value={destinationChain}
              onChange={(e) => setDestinationChain(e.target.value)}
              required
            >
              <option value="">Select destination chain</option>
              {CHAINS.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.logo} {chain.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              step="0.001"
              min="0.001"
              className="bg-gray-700 border-gray-600"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.01"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || isCheckingNetwork}>
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : !isConnected ? (
              "Connect Wallet"
            ) : !isOnOptimism ? (
              "Switch to Optimism"
            ) : (
              "Prepare Bridge Transaction"
            )}
          </Button>
        </form>

        {stargateUrl && (
          <div className="mt-4">
            <Button
              onClick={() => window.open(stargateUrl, "_blank")}
              className="w-full bg-purple-600 hover:bg-purple-700 mt-2"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Continue to Stargate Finance
            </Button>
            <p className="text-xs text-center mt-2 text-gray-400">
              You'll be redirected to Stargate Finance to complete your transaction
            </p>
          </div>
        )}

        <div className="mt-6 p-3 bg-gray-700 rounded text-sm">
          <h3 className="font-medium mb-2">Why use Stargate Finance?</h3>
          <ul className="list-disc pl-5 space-y-1 text-gray-300">
            <li>Reliable cross-chain bridging with high security</li>
            <li>Support for multiple chains and tokens</li>
            <li>User-friendly interface with clear fee structure</li>
            <li>Fast transaction processing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
