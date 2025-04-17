"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { isConnectedToOptimism, switchToOptimism } from "@/utils/network-utils"
import StargateRedirectButton from "./stargate-redirect-button"

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
  const [showStargateOption, setShowStargateOption] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [account, setAccount] = useState<string | null>(null) // Add account state
  const [balance, setBalance] = useState<string | null>(null)

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

            // Get account balance
            if (web3) {
              const account = accounts[0]
              setAccount(account)
              const balanceWei = await web3.eth.getBalance(account)
              const balanceEth = web3.utils.fromWei(balanceWei, "ether")
              setBalance(balanceEth)
              console.log(`Account balance: ${balanceEth} ETH`)
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
    const addressWithoutPrefix = address.substring(2).toLowerCase()

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
    setDebugInfo(null)
    setShowStargateOption(false)

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
      setAccount(accounts[0])
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
      const encodedRecipient = encodeAddressForLayerZero(account)
      console.log("Encoded recipient:", encodedRecipient)

      // Create the payload - for a simple ETH transfer, we just encode the amount
      // Make sure it's a full 32-byte value
      const payload = web3.eth.abi.encodeParameter("uint256", amountWei)
      console.log("Payload:", payload)

      // Create adapter parameters with a higher gas limit
      const adapterParams = createDefaultAdapterParams(500000) // 500k gas limit
      console.log("Adapter params:", adapterParams)

      // Zero address for ZRO token payments (we're not using ZRO)
      const zeroAddress = "0x0000000000000000000000000000000000000000"

      // Get current account balance
      const balanceWei = await web3.eth.getBalance(account)
      const balanceEth = web3.utils.fromWei(balanceWei, "ether")
      console.log(`Account balance: ${balanceEth} ETH`)

      // Use a fixed fee to avoid estimation issues
      const fixedFeeEth = 0.001 // 0.001 ETH
      const fixedFeeWei = web3.utils.toWei(fixedFeeEth.toString(), "ether")

      // Calculate total value to send (amount + fee)
      const amountEth = Number(web3.utils.fromWei(amountWei, "ether"))
      const totalEth = amountEth + fixedFeeEth
      const totalWei = web3.utils.toWei(totalEth.toString(), "ether")

      console.log("Transaction details:")
      console.log(`- Amount: ${amountEth} ETH`)
      console.log(`- Fee: ${fixedFeeEth} ETH`)
      console.log(`- Total: ${totalEth} ETH`)
      console.log(`- Balance: ${balanceEth} ETH`)

      // Check if we have enough balance
      if (Number(balanceEth) < totalEth) {
        throw new Error(`Insufficient balance. You need at least ${totalEth} ETH but have ${balanceEth} ETH.`)
      }

      // Log all parameters for debugging
      const txParams = {
        lzDestChainId,
        encodedRecipient,
        payload,
        refundAddress: account,
        zroPaymentAddress: zeroAddress,
        adapterParams,
        from: account,
        value: totalWei,
        gas: 1000000,
      }

      console.log("Transaction parameters:", txParams)
      setDebugInfo({
        transactionParams: txParams,
        balance: balanceEth,
        encodedRecipientLength: encodedRecipient.length,
        payloadLength: payload.length,
        adapterParamsLength: adapterParams.length,
      })

      // Show confirmation with detailed info
      toast({
        title: "Preparing Transaction",
        description: `Bridging ${testAmount} ETH to ${destChain.name} with a fee of ${fixedFeeEth} ETH`,
      })

      // Send the transaction
      console.log("Sending transaction...")
      const tx = await lzEndpoint.methods
        .send(
          lzDestChainId,
          encodedRecipient,
          payload,
          account, // refund address (same as sender)
          zeroAddress, // zroPaymentAddress - we're not using ZRO token
          adapterParams,
        )
        .send({
          from: account,
          value: totalWei,
          gas: 1000000, // Much higher gas limit for safety
          gasPrice: await web3.eth.getGasPrice(), // Use current gas price
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
      setShowStargateOption(true)

      // Add detailed error info
      setDebugInfo({
        ...debugInfo,
        error: err.message,
        errorObject: JSON.stringify(err, Object.getOwnPropertyNames(err)),
      })

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
            <p className="text-sm">• Fee: 0.001 ETH</p>
            <p className="text-sm">• Total: 0.0011 ETH</p>
            {balance && <p className="text-sm">• Your Balance: {Number(balance).toFixed(4)} ETH</p>}
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

        {showStargateOption && (
          <div className="mt-4">
            <p className="text-sm text-center mb-2">Direct bridge failed. Try using Stargate Finance instead:</p>
            <StargateRedirectButton
              destinationChainId={destinationChain ? Number.parseInt(destinationChain) : undefined}
              amount="0.0001"
              className="bg-purple-600 hover:bg-purple-700"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
