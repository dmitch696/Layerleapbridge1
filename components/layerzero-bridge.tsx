"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { isConnectedToOptimism, switchToOptimism } from "@/utils/network-utils"

// Chain data for UI
const CHAINS = [
  { id: 1, name: "Ethereum", logo: "🔷", lzChainId: 101 },
  { id: 42161, name: "Arbitrum", logo: "🔶", lzChainId: 110 },
  { id: 137, name: "Polygon", logo: "🟣", lzChainId: 109 },
  { id: 8453, name: "Base", logo: "🔵", lzChainId: 184 },
  { id: 43114, name: "Avalanche", logo: "❄️", lzChainId: 106 },
]

// LayerZero Endpoint address on Optimism
const LZ_ENDPOINT_ADDRESS = "0x3c2269811836af69497E5F486A85D7316753cf62"

// LayerZero Endpoint ABI (minimal version for what we need)
const LZ_ENDPOINT_ABI = [
  {
    inputs: [
      { internalType: "uint16", name: "_dstChainId", type: "uint16" },
      { internalType: "bytes", name: "_destination", type: "bytes" },
      { internalType: "bytes", name: "_payload", type: "bytes" },
      { internalType: "address payable", name: "_refundAddress", type: "address" },
      { internalType: "address", name: "_zroPaymentAddress", type: "address" },
      { internalType: "bytes", name: "_adapterParams", type: "bytes" },
    ],
    name: "send",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint16", name: "_dstChainId", type: "uint16" },
      { internalType: "bytes", name: "_destination", type: "bytes" },
      { internalType: "bytes", name: "_payload", type: "bytes" },
      { internalType: "address payable", name: "_refundAddress", type: "address" },
      { internalType: "address", name: "_zroPaymentAddress", type: "address" },
      { internalType: "bytes", name: "_adapterParams", type: "bytes" },
    ],
    name: "estimateFees",
    outputs: [
      { internalType: "uint256", name: "nativeFee", type: "uint256" },
      { internalType: "uint256", name: "zroFee", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
]

export default function LayerZeroBridge() {
  const { toast } = useToast()
  const [destinationChain, setDestinationChain] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(true)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isOnOptimism, setIsOnOptimism] = useState(false)
  const [web3, setWeb3] = useState<any>(null)

  // Initialize Web3 when component mounts
  useEffect(() => {
    async function initWeb3() {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          // Import Web3 dynamically to avoid "is not a constructor" error
          const Web3Module = await import("web3")
          // Handle both default export styles
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

  /**
   * Properly encode an address for LayerZero
   * This is the key function that fixes the "incorrect remote address size" error
   */
  function encodeAddressForLayerZero(address: string): string {
    if (!web3) return "0x"

    // Ensure the address is properly formatted
    if (!address.startsWith("0x")) {
      address = "0x" + address
    }

    // Remove the 0x prefix for encoding
    const addressWithoutPrefix = address.substring(2)

    // Pad the address to 32 bytes (64 hex characters)
    // This is what LayerZero expects - the address needs to be left-padded with zeros
    const paddedAddress = addressWithoutPrefix.padStart(64, "0")

    // Return with 0x prefix
    return "0x" + paddedAddress
  }

  /**
   * Create adapter parameters for LayerZero
   * This specifies gas parameters for the destination chain
   */
  function createDefaultAdapterParams(gasLimit = 200000): string {
    if (!web3) return "0x"

    // Version 1 of adapter params just contains the gas limit
    return web3.eth.abi.encodeParameters(["uint16", "uint256"], [1, gasLimit])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setTxHash(null)

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

      // Get current account
      const accounts = await window.ethereum.request({ method: "eth_accounts" })
      if (accounts.length === 0) {
        setError("No wallet connected")
        setIsLoading(false)
        return
      }
      const account = accounts[0]

      // Find the LayerZero chain ID for the destination
      const destChain = CHAINS.find((chain) => chain.id.toString() === destinationChain)
      if (!destChain) {
        throw new Error(`Destination chain ${destinationChain} not supported`)
      }
      const lzDestChainId = destChain.lzChainId

      // Use a minimal test amount for safety
      const testAmount = "0.0001" // 0.0001 ETH
      console.log(`Using test amount: ${testAmount} ETH for safety`)

      // Convert amount to wei
      const amountWei = web3.utils.toWei(testAmount, "ether")

      // Create LayerZero endpoint contract instance
      const lzEndpoint = new web3.eth.Contract(LZ_ENDPOINT_ABI, LZ_ENDPOINT_ADDRESS)

      // Properly encode the recipient address for LayerZero
      // This is the key fix for the "incorrect remote address size" error
      const encodedRecipient = encodeAddressForLayerZero(account)
      console.log("Encoded recipient:", encodedRecipient)

      // Create the payload - for a simple ETH transfer, we just encode the amount
      const payload = web3.eth.abi.encodeParameter("uint256", amountWei)

      // Create adapter parameters with a fixed gas limit
      const adapterParams = createDefaultAdapterParams(300000) // 300k gas limit

      // Estimate the fee
      const [nativeFee, zroFee] = await lzEndpoint.methods
        .estimateFees(
          lzDestChainId,
          encodedRecipient,
          payload,
          false, // payInZRO - we're paying in native token
          adapterParams,
        )
        .call()

      console.log("Estimated native fee:", web3.utils.fromWei(nativeFee, "ether"), "ETH")

      // Add a 20% buffer to the fee
      const feeWithBuffer = web3.utils.toBN(nativeFee).mul(web3.utils.toBN(120)).div(web3.utils.toBN(100))
      console.log("Fee with buffer:", web3.utils.fromWei(feeWithBuffer.toString(), "ether"), "ETH")

      // Calculate total value to send (amount + fee)
      const totalValue = web3.utils.toBN(amountWei).add(feeWithBuffer)
      console.log("Total value:", web3.utils.fromWei(totalValue.toString(), "ether"), "ETH")

      // Send the transaction
      console.log("Sending transaction...")
      const tx = await lzEndpoint.methods
        .send(
          lzDestChainId,
          encodedRecipient,
          payload,
          account, // refund address (same as sender)
          "0x0000000000000000000000000000000000000000", // zroPaymentAddress - we're not using ZRO token
          adapterParams,
        )
        .send({
          from: account,
          value: totalValue.toString(),
          gas: 500000, // Fixed high gas limit
        })

      console.log("Transaction sent:", tx.transactionHash)
      setTxHash(tx.transactionHash)

      toast({
        title: "Bridge Transaction Submitted",
        description: "Your test amount (0.0001 ETH) is being bridged. This may take 10-30 minutes to complete.",
      })
    } catch (err: any) {
      console.error("Bridge error:", err)
      setError(err.message || "An unknown error occurred")
      toast({
        title: "Error",
        description: err.message || "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl">LayerZero Direct Bridge</CardTitle>
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
              This bridge uses the LayerZero protocol directly with proper address encoding
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

          <div className="p-3 bg-gray-700 rounded">
            <p className="text-sm font-medium">Test Transaction Details:</p>
            <p className="text-sm">• Amount: 0.0001 ETH</p>
            <p className="text-sm">• Gas Limit: 300,000</p>
            <p className="text-xs text-gray-400 mt-1">
              For safety, we're using a minimal test amount with proper address encoding
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
              "Bridge via LayerZero"
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
