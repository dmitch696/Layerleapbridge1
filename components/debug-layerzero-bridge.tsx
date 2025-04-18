"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from 'lucide-react'
import { isConnectedToOptimism, switchToOptimism } from "@/utils/network-utils"

// LayerZero Endpoint address on Optimism
const LZ_ENDPOINT_ADDRESS = "0x3c2269811836af69497E5F486A85D7316753cf62"

// Chain data for UI with LayerZero chain IDs
const CHAINS = [
  { id: 1, name: "Ethereum", logo: "🔷", lzChainId: 101 },
  { id: 42161, name: "Arbitrum", logo: "🔶", lzChainId: 110 },
  { id: 137, name: "Polygon", logo: "🟣", lzChainId: 109 },
  { id: 8453, name: "Base", logo: "🔵", lzChainId: 184 },
  { id: 43114, name: "Avalanche", logo: "❄️", lzChainId: 106 },
]

// Minimal ABI for the LayerZero Endpoint
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
  // Add event for debugging
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint16", name: "dstChainId", type: "uint16" },
      { indexed: false, internalType: "address", name: "from", type: "address" },
      { indexed: false, internalType: "bytes", name: "to", type: "bytes" },
      { indexed: false, internalType: "uint256", name: "nonce", type: "uint256" },
      { indexed: false, internalType: "bytes", name: "payload", type: "bytes" },
    ],
    name: "SendToChain",
    type: "event",
  },
]

export default function DebugLayerZeroBridge() {
  const { toast } = useToast()
  const [destinationChain, setDestinationChain] = useState("")
  const [amount, setAmount] = useState("0.0001") // Very small test amount
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(true)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isOnOptimism, setIsOnOptimism] = useState(false)
  const [web3, setWeb3] = useState<any>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [gasLimit, setGasLimit] = useState("1000000") // Default high gas limit
  const [useSimplifiedPayload, setUseSimplifiedPayload] = useState(true)

  // Add a log function
  const addLog = (message: string) => {
    console.log(message)
    setLogs((prev) => [...prev, `${new Date().toISOString().split("T")[1].split(".")[0]}: ${message}`])
  }

  // Initialize Web3 when component mounts
  useEffect(() => {
    async function initWeb3() {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          addLog("Initializing Web3...")
          const Web3Module = await import("web3")
          const Web3 = Web3Module.default || Web3Module
          setWeb3(new Web3(window.ethereum))
          addLog("Web3 initialized successfully")
        } catch (error) {
          addLog(`Failed to initialize Web3: ${error}`)
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
          addLog("Checking wallet connection...")
          // Check if connected
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          const connected = accounts.length > 0
          setIsConnected(connected)

          if (connected) {
            addLog(`Wallet connected: ${accounts[0]}`)
            // Check if on Optimism
            const onOptimism = await isConnectedToOptimism()
            setIsOnOptimism(onOptimism)
            addLog(`On Optimism network: ${onOptimism}`)

            // Get account
            const account = accounts[0]
            setAccount(account)

            // Get balance if web3 is initialized
            if (web3) {
              try {
                const balanceWei = await web3.eth.getBalance(account)
                const balanceEth = web3.utils.fromWei(balanceWei, "ether")
                addLog(`Account balance: ${balanceEth} ETH`)
              } catch (balanceError) {
                addLog(`Error getting balance: ${balanceError}`)
              }
            }
          } else {
            addLog("No wallet connected")
          }
        } catch (error) {
          addLog(`Error checking wallet connection: ${error}`)
          console.error("Error checking wallet connection:", error)
        }
      } else {
        addLog("Ethereum provider not found")
      }

      setIsCheckingNetwork(false)
    }

    checkConnection()

    // Set up event listeners for account and chain changes
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        setIsConnected(accounts.length > 0)
        if (accounts.length > 0) {
          addLog(`Account changed: ${accounts[0]}`)
          setAccount(accounts[0])
          const onOptimism = await isConnectedToOptimism()
          setIsOnOptimism(onOptimism)
          addLog(`On Optimism network: ${onOptimism}`)
        } else {
          addLog("Wallet disconnected")
          setIsOnOptimism(false)
          setAccount(null)
        }
      }

      const handleChainChanged = async (chainIdHex: string) => {
        const chainId = Number.parseInt(chainIdHex, 16)
        addLog(`Chain changed to: ${chainId}`)
        const onOptimism = await isConnectedToOptimism()
        setIsOnOptimism(onOptimism)
        addLog(`On Optimism network: ${onOptimism}`)
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      // Cleanup
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [web3])

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
      addLog("Connecting wallet...")
      await window.ethereum.request({ method: "eth_requestAccounts" })
      const accounts = await window.ethereum.request({ method: "eth_accounts" })
      setIsConnected(accounts.length > 0)

      if (accounts.length > 0) {
        addLog(`Wallet connected: ${accounts[0]}`)
        setAccount(accounts[0])
        const onOptimism = await isConnectedToOptimism()
        setIsOnOptimism(onOptimism)
        addLog(`On Optimism network: ${onOptimism}`)
      }

      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected successfully.",
      })
    } catch (error: any) {
      addLog(`Connection failed: ${error.message}`)
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    }
  }

  /**
   * Properly encode an address for LayerZero
   */
  // Check for any problematic Unicode characters or escape sequences

  // For example, check the encodeAddressForLayerZero function
  function encodeAddressForLayerZero(address: string): string {
    if (!web3) return "0x"
    
    // Ensure the address is properly formatted
    if (!address.startsWith("0x")) {
      address = "0x" + address
    }
    
    // Remove the 0x prefix for encoding
    const addressWithoutPrefix = address.substring(2).toLowerCase()
    
    // Pad the address to 32 bytes (64 hex characters)
    const paddedAddress = addressWithoutPrefix.padStart(64, "0")
    
    // Return with 0x prefix
    const result = "0x" + paddedAddress
    addLog(`Encoded address: ${result} (length: ${result.length})`)
    return result
  }

  /**
   * Create adapter parameters for LayerZero
   */
  function createDefaultAdapterParams(gasLimit = "200000"): string {
    if (!web3) return "0x"

    // Convert string to number
    const gasLimitNum = Number.parseInt(gasLimit)
    addLog(`Creating adapter params with gas limit: ${gasLimitNum}`)

    // Version 1 of adapter params just contains the gas limit
    const result = web3.eth.abi.encodeParameters(["uint16", "uint256"], [1, gasLimitNum])
    addLog(`Adapter params: ${result}`)
    return result
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setTxHash(null)
    setLogs([])

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
        addLog("Not on Optimism network. Switching...")
        toast({
          title: "Wrong Network",
          description: "Switching to Optimism network...",
        })

        const switched = await switchToOptimism()
        if (!switched) {
          addLog("Failed to switch to Optimism network")
          toast({
            title: "Network Switch Failed",
            description: "Could not switch to Optimism network. Please try manually switching in your wallet.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        addLog("Successfully switched to Optimism network")
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
      addLog(`Using account: ${account}`)

      // Find the LayerZero chain ID for the destination
      const destChain = CHAINS.find((chain) => chain.id.toString() === destinationChain)
      if (!destChain) {
        throw new Error(`Destination chain ${destinationChain} not supported`)
      }
      const lzDestChainId = destChain.lzChainId
      addLog(`Destination chain: ${destChain.name} (LZ Chain ID: ${lzDestChainId})`)

      // Convert amount to wei
      const amountWei = web3.utils.toWei(amount, "ether")
      addLog(`Amount: ${amount} ETH (${amountWei} wei)`)

      // Create LayerZero endpoint contract instance
      addLog(`Creating contract instance for endpoint: ${LZ_ENDPOINT_ADDRESS}`)
      const lzEndpoint = new web3.eth.Contract(LZ_ENDPOINT_ABI, LZ_ENDPOINT_ADDRESS)

      // Properly encode the recipient address for LayerZero
      const encodedRecipient = encodeAddressForLayerZero(account)

      // Create the payload - simplified for debugging
      let payload
      if (useSimplifiedPayload) {
        // Use a very simple payload - just a fixed string
        payload = web3.eth.abi.encodeParameter("string", "test")
        addLog(`Using simplified payload: ${payload}`)
      } else {
        // Use the standard amount payload
        payload = web3.eth.abi.encodeParameter("uint256", amountWei)
        addLog(`Using standard payload: ${payload}`)
      }

      // Create adapter parameters with the specified gas limit
      const adapterParams = createDefaultAdapterParams(gasLimit)

      // Zero address for ZRO token payments (we're not using ZRO)
      const zeroAddress = "0x0000000000000000000000000000000000000000"

      // Get current account balance
      const balanceWei = await web3.eth.getBalance(account)
      const balanceEth = web3.utils.fromWei(balanceWei, "ether")
      addLog(`Account balance: ${balanceEth} ETH`)

      // Fixed fee for debugging (0.0003 ETH)
      const feeEth = "0.0003"
      const feeWei = web3.utils.toWei(feeEth, "ether")
      addLog(`Using fixed fee: ${feeEth} ETH (${feeWei} wei)`)

      // Calculate total value to send (amount + fee)
      const amountEth = Number(amount)
      const totalEth = amountEth + Number(feeEth)
      const totalWei = web3.utils.toWei(totalEth.toString(), "ether")
      addLog(`Total value: ${totalEth} ETH (${totalWei} wei)`)

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
        gas: Number.parseInt(gasLimit),
      }

      addLog(`Transaction parameters: ${JSON.stringify(txParams, null, 2)}`)

      // Show confirmation with detailed info
      toast({
        title: "Preparing Transaction",
        description: `Bridging ${amount} ETH to ${destChain.name} with a fee of ${feeEth} ETH`,
      })

      // Send the transaction
      addLog("Sending transaction...")
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
          gas: Number.parseInt(gasLimit),
          gasPrice: await web3.eth.getGasPrice(), // Use current gas price
        })

      addLog(`Transaction sent: ${tx.transactionHash}`)
      setTxHash(tx.transactionHash)

      // Check for events
      if (tx.events && tx.events.SendToChain) {
        addLog(`SendToChain event found: ${JSON.stringify(tx.events.SendToChain.returnValues)}`)
      } else {
        addLog("No SendToChain event found in transaction receipt")
      }

      toast({
        title: "Bridge Transaction Submitted",
        description: `Your ${amount} ETH is being bridged. This may take 10-30 minutes to complete.`,
      })
    } catch (err: any) {
      console.error("Bridge error:", err)
      addLog(`Error: ${err.message}`)

      // Try to extract more detailed error information
      if (err.code) {
        addLog(`Error code: ${err.code}`)
      }

      if (err.data) {
        addLog(`Error data: ${JSON.stringify(err.data)}`)
      }

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
        <CardTitle className="text-xl">LayerZero Debug Bridge</CardTitle>
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
            <p className="text-xs text-gray-400 mt-1">Debug version with detailed logging and simplified parameters</p>
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
                  {chain.logo} {chain.name} (LZ: {chain.lzChainId})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ETH)</Label>
            <Input
              id="amount"
              type="text"
              className="bg-gray-700 border-gray-600"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0001"
              required
            />
            <p className="text-xs text-gray-400">Using a very small test amount is recommended</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gasLimit">Gas Limit</Label>
            <Input
              id="gasLimit"
              type="text"
              className="bg-gray-700 border-gray-600"
              value={gasLimit}
              onChange={(e) => setGasLimit(e.target.value)}
              placeholder="1000000"
            />
            <p className="text-xs text-gray-400">Higher gas limits may help with complex cross-chain operations</p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="simplifiedPayload"
              checked={useSimplifiedPayload}
              onChange={(e) => setUseSimplifiedPayload(e.target.checked)}
              className="rounded bg-gray-700 border-gray-600"
            />
            <Label htmlFor="simplifiedPayload">Use simplified payload (for debugging)</Label>
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
              "Debug Bridge via LayerZero"
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
          </div>
        )}

        {/* Debug Logs */}
        <div className="mt-4">
          <details>
            <summary className="cursor-pointer font-medium">Debug Logs</summary>
            <div className="mt-2 p-2 bg-gray-900 rounded max-h-60 overflow-auto">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="text-xs font-mono mb-1">
                    {log}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No logs yet</p>
              )}
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  )
}
