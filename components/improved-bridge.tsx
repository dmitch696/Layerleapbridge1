"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { CHAINS } from "@/config/contracts"
import {
  isConnectedToOptimism,
  switchToOptimism,
  isChainSupported,
  getBridgeFee,
  bridgeETH,
} from "@/services/enhanced-bridge-service"
import { Loader2 } from "lucide-react"
import TransactionHistory from "./transaction-history"

export default function ImprovedBridge() {
  const { toast } = useToast()
  const [destinationChain, setDestinationChain] = useState("")
  const [amount, setAmount] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(true)
  const [isCheckingSupport, setIsCheckingSupport] = useState(false)
  const [fee, setFee] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isOnOptimism, setIsOnOptimism] = useState(false)
  const [supportedChains, setSupportedChains] = useState<Record<number, boolean>>({})
  const [showHistory, setShowHistory] = useState(false)

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
            // Get current address and use it as recipient
            setRecipientAddress(accounts[0])

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
      window.ethereum.on("accountsChanged", async (accounts: string[]) => {
        setIsConnected(accounts.length > 0)
        if (accounts.length > 0) {
          setRecipientAddress(accounts[0])
          const onOptimism = await isConnectedToOptimism()
          setIsOnOptimism(onOptimism)
        } else {
          setIsOnOptimism(false)
        }
      })

      window.ethereum.on("chainChanged", async () => {
        const onOptimism = await isConnectedToOptimism()
        setIsOnOptimism(onOptimism)
      })
    }

    // Cleanup
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged")
        window.ethereum.removeAllListeners("chainChanged")
      }
    }
  }, [])

  // Check which chains are supported
  useEffect(() => {
    async function checkSupportedChains() {
      if (!isConnected) return

      setIsCheckingSupport(true)
      const supported: Record<number, boolean> = {}

      for (const chain of CHAINS) {
        supported[chain.id] = await isChainSupported(chain.id)
      }

      console.log("Supported chains:", supported)
      setSupportedChains(supported)
      setIsCheckingSupport(false)
    }

    checkSupportedChains()
  }, [isConnected, isOnOptimism])

  // Update fee when inputs change
  useEffect(() => {
    async function updateFee() {
      if (destinationChain && amount && Number.parseFloat(amount) > 0 && recipientAddress) {
        try {
          const result = await getBridgeFee(Number.parseInt(destinationChain), recipientAddress, amount)

          if (result.success && result.fee) {
            setFee(result.fee)
          } else if (result.error) {
            console.warn("Fee estimation error:", result.error)
          }
        } catch (error) {
          console.error("Error updating fee:", error)
        }
      } else {
        setFee(null)
      }
    }

    updateFee()
  }, [destinationChain, amount, recipientAddress])

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
        setRecipientAddress(accounts[0])
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
    setError(null)
    setTxHash(null)

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
        setError("Please fill in all fields")
        setIsLoading(false)
        return
      }

      const amountNum = Number.parseFloat(amount)
      if (isNaN(amountNum) || amountNum <= 0) {
        setError("Please enter a valid amount")
        setIsLoading(false)
        return
      }

      // Check if destination chain is supported
      const destChainId = Number.parseInt(destinationChain)
      if (!supportedChains[destChainId]) {
        setError(
          `Destination chain ${CHAINS.find((c) => c.id === destChainId)?.name || destChainId} is not supported by the bridge contract.`,
        )
        setIsLoading(false)
        return
      }

      // Execute bridge
      const result = await bridgeETH(Number.parseInt(destinationChain), recipientAddress, amount)

      if (result.success && result.txHash) {
        setTxHash(result.txHash)
        toast({
          title: "Bridge Transaction Submitted",
          description: "Your assets are being bridged. This may take 10-30 minutes to complete.",
        })
        // Reset amount after successful transaction
        setAmount("")
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
    <div className="space-y-6">
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
                    {chain.logo} {chain.name}{" "}
                    {isConnected && supportedChains[chain.id] === false ? "(Not Supported)" : ""}
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

            <div className="p-3 bg-green-900/30 rounded">
              <div className="flex items-center gap-2">
                <span className="text-green-400 font-medium">Recipient:</span>
                <span className="text-sm break-all">{recipientAddress || "Connect wallet to set recipient"}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Your connected wallet address will automatically be used as the recipient
              </p>
            </div>

            {fee && (
              <div className="p-3 bg-gray-700 rounded">
                <p className="text-sm">Estimated Fee: {fee} ETH</p>
                <p className="text-sm">
                  Total: {(Number.parseFloat(amount || "0") + Number.parseFloat(fee)).toFixed(6)} ETH
                </p>
                <p className="text-xs text-gray-400 mt-1">Includes gas fees for the destination chain</p>
              </div>
            )}

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

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? "Hide Transaction History" : "Show Transaction History"}
        </Button>
      </div>

      {showHistory && <TransactionHistory />}
    </div>
  )
}
