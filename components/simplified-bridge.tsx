"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { isConnectedToOptimism, switchToOptimism } from "@/utils/network-utils"
import StargateBridgeButton from "./stargate-bridge-button"

// Chain data for UI
const CHAINS = [
  { id: 1, name: "Ethereum", logo: "🔷" },
  { id: 42161, name: "Arbitrum", logo: "🔶" },
  { id: 137, name: "Polygon", logo: "🟣" },
  { id: 8453, name: "Base", logo: "🔵" },
  { id: 43114, name: "Avalanche", logo: "❄️" },
]

export default function SimplifiedBridge() {
  const { toast } = useToast()
  const [destinationChain, setDestinationChain] = useState("")
  const [amount, setAmount] = useState("0.01")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [isOnOptimism, setIsOnOptimism] = useState(false)
  const [web3, setWeb3] = useState<any>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)

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
            // Check if on Optimism
            const onOptimism = await isConnectedToOptimism()
            setIsOnOptimism(onOptimism)

            // Get account balance
            if (web3) {
              const account = accounts[0]
              setAccount(account)
              const balanceWei = await web3.eth.getBalance(account)
              const balanceEth = web3.utils.fromWei(balanceWei, "ether")
              setBalance(balanceEth)
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
          const onOptimism = await isConnectedToOptimism()
          setIsOnOptimism(onOptimism)

          // Update account and balance
          if (web3) {
            const account = accounts[0]
            setAccount(account)
            const balanceWei = await web3.eth.getBalance(account)
            const balanceEth = web3.utils.fromWei(balanceWei, "ether")
            setBalance(balanceEth)
          }
        } else {
          setIsOnOptimism(false)
          setAccount(null)
          setBalance(null)
        }
      }

      const handleChainChanged = async () => {
        const onOptimism = await isConnectedToOptimism()
        setIsOnOptimism(onOptimism)

        // Update balance on chain change
        if (web3 && account) {
          const balanceWei = await web3.eth.getBalance(account)
          const balanceEth = web3.utils.fromWei(balanceWei, "ether")
          setBalance(balanceEth)
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

  const handlePrepare = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

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

      // Check if we have enough balance
      if (balance && Number(balance) < amountNum) {
        toast({
          title: "Insufficient Balance",
          description: `You need at least ${amountNum} ETH but have ${Number(balance).toFixed(4)} ETH.`,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Show success message
      toast({
        title: "Ready to Bridge",
        description: "Click the button below to continue to Stargate Finance.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl">Bridge Your Assets</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handlePrepare} className="space-y-4">
          <div className="p-3 bg-blue-900/30 rounded mb-4">
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-medium">Source:</span>
              <span className="flex items-center gap-1">
                <span>🔴</span>
                <span>Optimism</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Bridge your assets from Optimism to other chains using Stargate Finance
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
            {balance && <p className="text-xs text-gray-400">Your balance: {Number(balance).toFixed(4)} ETH</p>}
          </div>

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
              "Prepare Bridge Transaction"
            )}
          </Button>

          {isConnected && isOnOptimism && destinationChain && (
            <StargateBridgeButton
              destinationChainId={Number.parseInt(destinationChain)}
              amount={amount}
              className="bg-purple-600 hover:bg-purple-700 mt-2"
            />
          )}
        </form>

        <div className="mt-6 p-3 bg-gray-700 rounded text-sm">
          <h3 className="font-medium mb-2">Why use Stargate Finance?</h3>
          <ul className="list-disc pl-5 space-y-1 text-gray-300">
            <li>Reliable cross-chain bridging with high security</li>
            <li>Support for multiple chains and tokens</li>
            <li>User-friendly interface with clear fee structure</li>
            <li>Fast transaction processing</li>
            <li>Built on top of LayerZero protocol</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
