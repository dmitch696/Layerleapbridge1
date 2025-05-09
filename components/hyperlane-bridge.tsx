"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input" // Added Input component
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { isConnectedToOptimism, switchToOptimism } from "@/utils/network-utils"
import { CHAINS, getHyperlaneBridgeFee, bridgeETH, isChainSupported } from "@/services/hyperlane-bridge-service"

export default function HyperlaneBridge() {
  const { toast } = useToast()
  const [destinationChain, setDestinationChain] = useState("")
  const [amount, setAmount] = useState("0.01") // Default amount
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(true)
  const [isCheckingSupport, setIsCheckingSupport] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isOnOptimism, setIsOnOptimism] = useState(false)
  const [web3, setWeb3] = useState<any>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [fee, setFee] = useState<string | null>(null)
  const [supportedChains, setSupportedChains] = useState<Record<number, boolean>>({})
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

  // Update fee when destination chain or amount changes
  useEffect(() => {
    async function updateFee() {
      if (destinationChain && account && amount) {
        try {
          const result = await getHyperlaneBridgeFee(
            Number.parseInt(destinationChain),
            account,
            amount, // Use the user-specified amount
          )

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
  }, [destinationChain, account, amount]) // Added amount as a dependency

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
    setError(null)
    setTxHash(null)
    setDebugInfo(null)

    try {
      // Check if web3 is initialized
      if (!web3) {
        throw new Error("Web3 is not initialized. Please refresh the page and try again.")
      }

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

      // Get current account
      const accounts = await window.ethereum.request({ method: "eth_accounts" })
      if (accounts.length === 0) {
        setError("No wallet connected")
        setIsLoading(false)
        return
      }

      // Check if destination chain is supported
      const destChainId = Number.parseInt(destinationChain)
      if (!supportedChains[destChainId]) {
        setError(
          `Destination chain ${CHAINS.find((c) => c.id === destChainId)?.name || destChainId} is not supported by Hyperlane.`,
        )
        setIsLoading(false)
        return
      }

      // Execute bridge with user-specified amount
      const result = await bridgeETH(destChainId, accounts[0], amount)

      if (result.success && result.txHash) {
        setTxHash(result.txHash)
        toast({
          title: "Bridge Transaction Submitted",
          description: `Your ${amount} ETH is being bridged. This may take 10-30 minutes to complete.`,
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
        <CardTitle className="text-xl">Hyperlane Bridge</CardTitle>
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
              This bridge uses the Hyperlane protocol for direct bridging of assets
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

          {/* Added amount input field */}
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
              placeholder="0.01"
              required
            />
          </div>

          <div className="p-3 bg-gray-700 rounded">
            <p className="text-sm font-medium">Transaction Details:</p>
            <p className="text-sm">• Amount: {amount} ETH</p>
            {fee && <p className="text-sm">• Bridge Fee: {fee} ETH</p>}
            {fee && <p className="text-sm">• Total: {(Number(amount) + Number(fee)).toFixed(6)} ETH</p>}
            {balance && <p className="text-sm">• Your Balance: {Number(balance).toFixed(4)} ETH</p>}
            <p className="text-xs text-gray-400 mt-1">
              Base fee is 0.0003 ETH plus gas costs for the destination chain
            </p>
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
              "Bridge via Hyperlane"
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

        <div className="mt-6 p-3 bg-gray-700 rounded text-sm">
          <h3 className="font-medium mb-2">About Hyperlane</h3>
          <p className="mb-3">
            Hyperlane is an interoperability protocol that allows secure communication between blockchains. It uses a
            modular security model where validators attest to messages on the source chain, and relayers deliver these
            messages to the destination chain.
          </p>
          <p>Key features:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-300">
            <li>Permissionless interchain messaging</li>
            <li>Customizable security model</li>
            <li>Sovereign consensus</li>
            <li>Developer-friendly interfaces</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
