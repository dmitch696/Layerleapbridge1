"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import {
  CHAINS,
  isConnectedToOptimism,
  switchToOptimism,
  getStargateBridgeFee,
  bridgeViaStargate,
} from "@/services/stargate-compatible-service"

export default function StargateCompatibleBridge() {
  const { toast } = useToast()
  const [destinationChain, setDestinationChain] = useState("")
  const [amount, setAmount] = useState("0.0001") // Small default amount
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
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Initialize Web3 when component mounts
  useEffect(() => {
    async function initWeb3() {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const Web3Module = await import("web3")
          const Web3 = Web3Module.default || Web3Module
          setWeb3(new Web3(window.ethereum))
        } catch (error) {
          console.error("Failed to initialize Web3:", error)
        }
      }
    }

    initWeb3()
  }, [])

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
            // Get current account
            const account = accounts[0]
            setAccount(account)

            // Check if on Optimism
            const onOptimism = await isConnectedToOptimism()
            setIsOnOptimism(onOptimism)

            // Get account balance if web3 is initialized
            if (web3 && account) {
              try {
                const balanceWei = await web3.eth.getBalance(account)
                const balanceEth = web3.utils.fromWei(balanceWei, "ether")
                setBalance(balanceEth)
              } catch (balanceError) {
                console.error("Error getting balance:", balanceError)
              }
            }
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
          setAccount(accounts[0])

          // Check if on Optimism
          const onOptimism = await isConnectedToOptimism()
          setIsOnOptimism(onOptimism)

          // Get balance if web3 is initialized
          if (web3) {
            try {
              const balanceWei = await web3.eth.getBalance(accounts[0])
              const balanceEth = web3.utils.fromWei(balanceWei, "ether")
              setBalance(balanceEth)
            } catch (balanceError) {
              console.error("Error getting balance:", balanceError)
            }
          }
        } else {
          setIsOnOptimism(false)
          setAccount(null)
          setBalance(null)
        }
      }

      const handleChainChanged = async (chainIdHex: string) => {
        console.log("Chain changed to:", chainIdHex)

        // Check if on Optimism
        const onOptimism = await isConnectedToOptimism()
        setIsOnOptimism(onOptimism)

        // Update balance if account exists and web3 is initialized
        if (web3 && account) {
          try {
            const balanceWei = await web3.eth.getBalance(account)
            const balanceEth = web3.utils.fromWei(balanceWei, "ether")
            setBalance(balanceEth)
          } catch (balanceError) {
            console.error("Error getting balance:", balanceError)
          }
        }
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      // Cleanup
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [web3, account])

  // Update fee when inputs change
  useEffect(() => {
    async function updateFee() {
      if (destinationChain && account && amount && Number.parseFloat(amount) > 0) {
        try {
          const result = await getStargateBridgeFee(Number.parseInt(destinationChain), account, amount)

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
  }, [destinationChain, account, amount])

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
        setAccount(accounts[0])

        // Check if on Optimism
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
    setDebugInfo(null)

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
      if (!destinationChain) {
        setError("Please select a destination chain")
        setIsLoading(false)
        return
      }

      if (!amount || Number.parseFloat(amount) <= 0) {
        setError("Please enter a valid amount")
        setIsLoading(false)
        return
      }

      // Execute bridge with Stargate-compatible parameters
      const result = await bridgeViaStargate(
        Number.parseInt(destinationChain),
        account!, // We know account is not null here
        amount,
      )

      if (result.success && result.txHash) {
        setTxHash(result.txHash)
        toast({
          title: "Bridge Transaction Submitted",
          description: "Your assets are being bridged. This may take 10-30 minutes to complete.",
        })
      } else {
        setError(result.error || "Bridge transaction failed")
        setDebugInfo(result.debugInfo)
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
      <CardHeader>
        <CardTitle className="text-xl">Stargate-Compatible Bridge</CardTitle>
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
              This bridge uses the same parameters as Stargate for direct LayerZero transactions
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
              step="0.0001"
              min="0.0001"
              className="bg-gray-700 border-gray-600"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0001"
              required
            />
            <p className="text-xs text-gray-400">For testing, we'll use a small amount (0.0001 ETH)</p>
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

          <Button type="submit" className="w-full" disabled={isLoading || isCheckingNetwork || !web3}>
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : !web3 ? (
              "Initializing Web3..."
            ) : !isConnected ? (
              "Connect Wallet"
            ) : !isOnOptimism ? (
              "Switch to Optimism"
            ) : (
              "Bridge via Stargate-Compatible LayerZero"
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
            <p className="text-xs text-gray-400 mt-2">
              Check the transaction on{" "}
              <a
                href={`https://layerzeroscan.com/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                LayerZero Scan
              </a>{" "}
              to track cross-chain message delivery
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-800/50 rounded">
            <p className="font-medium">Error</p>
            <p className="text-sm break-all">{error}</p>

            {debugInfo && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-gray-400">Show Debug Info</summary>
                <pre className="mt-2 p-2 bg-gray-900 rounded overflow-auto max-h-40">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
