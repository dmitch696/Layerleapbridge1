"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { isConnectedToOptimism, switchToOptimism } from "@/utils/network-utils"
import { CHAINS, bridgeETH, isChainSupported } from "@/services/resilient-bridge-service"

export default function OptimizedBridge() {
  const { toast } = useToast()
  const [destinationChain, setDestinationChain] = useState("")
  const [amount, setAmount] = useState("0.01")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(true)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isOnOptimism, setIsOnOptimism] = useState(false)
  const [web3, setWeb3] = useState<any>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [fee, setFee] = useState<string | null>(null)
  const [supportedChains, setSupportedChains] = useState<Record<number, boolean>>({})
  const [isCheckingSupport, setIsCheckingSupport] = useState(false)

  useEffect(() => {
    async function checkConnection() {
      setIsCheckingNetwork(true)

      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          setIsConnected(accounts.length > 0)
          setIsOnOptimism(await isConnectedToOptimism())
        } catch (error) {
          console.error("Error checking wallet connection:", error)
        }
      }

      setIsCheckingNetwork(false)
    }

    checkConnection()

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => checkConnection())
      window.ethereum.on("chainChanged", () => checkConnection())
      return () => {
        window.ethereum.removeAllListeners("accountsChanged")
        window.ethereum.removeAllListeners("chainChanged")
      }
    }
  }, [])

  useEffect(() => {
    async function checkSupported() {
      setIsCheckingSupport(true)
      const supported: Record<number, boolean> = {}
      for (const chain of CHAINS) {
        supported[chain.id] = await isChainSupported(chain.id)
      }
      setSupportedChains(supported)
      setIsCheckingSupport(false)
    }
    checkSupported()
  }, [isConnected, isOnOptimism])

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
      setIsConnected(true)
      setIsOnOptimism(await isConnectedToOptimism())
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
    setError(null)
    setTxHash(null)

    try {
      if (!isConnected) {
        await connectWallet()
        setIsLoading(false)
        return
      }

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
      }

      if (!destinationChain) {
        setError("Please select a destination chain")
        setIsLoading(false)
        return
      }

      const result = await bridgeETH(Number.parseInt(destinationChain), amount)

      if (result.success && result.txHash) {
        setTxHash(result.txHash)
        toast({
          title: "Bridge Transaction Submitted",
          description: "Your assets are being bridged. This may take 10-30 minutes to complete.",
        })
      } else {
        setError(result.error || "Bridge transaction failed")
        toast({
          title: "Bridge Failed",
          description: result.error || "Failed to bridge assets",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error",
        description: err.message,
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
          <div className="p-3 bg-blue-900/30 rounded mb-4">
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-medium">Source:</span>
              <span className="flex items-center gap-1">
                <span>🔴</span>
                <span>Optimism</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">This bridge allows transfers from Optimism to other chains</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destinationChain">Destination Chain</Label>
            <select
              id="destinationChain"
              className="w-full p-2 bg-gray-700 rounded"
              value={destinationChain}
              onChange={(e) => setDestinationChain(e.target.value)}
              required
              disabled={isCheckingSupport}
            >
              <option value="">Select destination chain</option>
              {CHAINS.map((chain) => (
                <option key={chain.id} value={chain.id} disabled={isConnected && supportedChains[chain.id] === false}>
                  {chain.logo} {chain.name}
                  {isConnected && supportedChains[chain.id] === false ? " (Not Supported)" : ""}
                </option>
              ))}
            </select>
            {isCheckingSupport && (
              <div className="flex items-center text-xs text-gray-400">
                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                Checking supported chains...
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              step="0.0001"
              min="0.0001"
              className="bg-gray-700 border-gray-600"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0001"
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
              "Bridge ETH via LayerZero"
            )}
          </Button>
        </form>

        {txHash && (
          <div className="mt-4 p-3 bg-green-800/50 rounded">
            <p className="font-medium">Transaction Submitted!</p>
            <p className="text-sm break-all">Hash: {txHash}</p>
            <a
              href={`https://optimistic.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline text-sm"
            >
              View on Optimism Explorer
            </a>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-800/50 rounded">
            <p className="font-medium">Error</p>
            <p className="text-sm break-all">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
