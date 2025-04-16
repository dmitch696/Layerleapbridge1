"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { bridgeViaLayerZero, getLayerZeroBridgeFee, CHAINS } from "@/services/layer-zero-bridge"

export default function LayerZeroBridge() {
  const { toast } = useToast()
  const [destinationChain, setDestinationChain] = useState("")
  const [amount, setAmount] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [fee, setFee] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currentChainId, setCurrentChainId] = useState<number | null>(null)

  // Check if wallet is connected and on the right network
  useEffect(() => {
    async function checkConnection() {
      if (window.ethereum) {
        try {
          // Check if connected
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          const isConnected = accounts.length > 0
          setIsConnected(isConnected)

          if (isConnected) {
            // Get current address
            setRecipientAddress(accounts[0])

            // Get current chain
            const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
            const chainId = Number.parseInt(chainIdHex, 16)
            setCurrentChainId(chainId)
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error)
        }
      }
    }

    checkConnection()

    // Set up event listeners for account and chain changes
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setIsConnected(accounts.length > 0)
        if (accounts.length > 0) {
          setRecipientAddress(accounts[0])
        }
      })

      window.ethereum.on("chainChanged", (chainIdHex: string) => {
        setCurrentChainId(Number.parseInt(chainIdHex, 16))
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

  // Update fee when inputs change
  useEffect(() => {
    async function updateFee() {
      if (destinationChain && amount && Number.parseFloat(amount) > 0 && recipientAddress) {
        try {
          const result = await getLayerZeroBridgeFee(Number.parseInt(destinationChain), recipientAddress, amount)

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
      }

      const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
      setCurrentChainId(Number.parseInt(chainIdHex, 16))

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

  const switchToOptimism = async () => {
    if (!window.ethereum) return

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xA" }], // 10 in hex
      })
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xA",
                chainName: "Optimism",
                nativeCurrency: {
                  name: "Ethereum",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["https://mainnet.optimism.io"],
                blockExplorerUrls: ["https://optimistic.etherscan.io"],
              },
            ],
          })
        } catch (addError) {
          console.error("Error adding Optimism network:", addError)
        }
      }
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
      if (currentChainId !== 10) {
        toast({
          title: "Wrong Network",
          description: "Please switch to Optimism network to use this bridge.",
          variant: "destructive",
        })
        await switchToOptimism()
        setIsLoading(false)
        return
      }

      // Validate inputs
      if (!destinationChain || !amount || !recipientAddress) {
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

      // Execute bridge
      const result = await bridgeViaLayerZero(Number.parseInt(destinationChain), recipientAddress, amount)

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
              step="0.0001"
              min="0.0001"
              className="bg-gray-700 border-gray-600"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0001"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              type="text"
              className="bg-gray-700 border-gray-600"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="0x..."
              required
            />
            <p className="text-xs text-gray-400">Address that will receive the funds on the destination chain</p>
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? "Processing..."
              : !isConnected
                ? "Connect Wallet"
                : currentChainId !== 10
                  ? "Switch to Optimism"
                  : "Bridge ETH via LayerZero"}
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
            <p className="text-sm">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
