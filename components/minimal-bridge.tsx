"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/hooks/use-wallet"

// Chain data
const chains = [
  { id: "ethereum", name: "Ethereum", chainId: 1 },
  { id: "arbitrum", name: "Arbitrum", chainId: 42161 },
  { id: "optimism", name: "Optimism", chainId: 10 },
  { id: "polygon", name: "Polygon", chainId: 137 },
  { id: "base", name: "Base", chainId: 8453 },
  { id: "avalanche", name: "Avalanche", chainId: 43114 },
]

// Token data
const tokens = [
  { id: "eth", name: "ETH", decimals: 18 },
  { id: "usdc", name: "USDC", decimals: 6 },
  { id: "usdt", name: "USDT", decimals: 6 },
  { id: "dai", name: "DAI", decimals: 18 },
]

export default function MinimalBridge() {
  const { address, isConnected, chainId, switchNetwork } = useWallet()
  const [protocol, setProtocol] = useState("hyperlane")
  const [sourceChain, setSourceChain] = useState("")
  const [destChain, setDestChain] = useState("")
  const [token, setToken] = useState("")
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [bridgeFee, setBridgeFee] = useState("~0.001 ETH")
  const [estimatedTime, setEstimatedTime] = useState("~15 minutes")

  // Set source chain based on connected network
  useEffect(() => {
    if (chainId) {
      const matchedChain = chains.find((c) => c.chainId === chainId)
      if (matchedChain) {
        setSourceChain(matchedChain.id)
      }
    }
  }, [chainId])

  const handleSwapChains = () => {
    const temp = sourceChain
    setSourceChain(destChain)
    setDestChain(temp)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isConnected) {
      alert("Please connect your wallet first")
      return
    }

    if (!sourceChain || !destChain || !token || !amount) {
      alert("Please fill in all fields")
      return
    }

    setIsLoading(true)

    try {
      // Get source chain ID for network switching
      const sourceChainObj = chains.find((c) => c.id === sourceChain)

      // Switch network if needed
      if (sourceChainObj && chainId !== sourceChainObj.chainId) {
        alert(`Switching to ${sourceChainObj.name} network...`)
        const switched = await switchNetwork(sourceChainObj.chainId)
        if (!switched) {
          throw new Error("Failed to switch network")
        }
      }

      // Simulate bridge transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate a mock transaction hash
      const txHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`

      alert(`Bridge transaction submitted! Tx: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`)

      // Reset form
      setAmount("")
    } catch (error) {
      console.error("Bridge error:", error)
      alert(`Bridge failed: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Cross-Chain Bridge</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="mb-2">Protocol</p>
          <div className="flex space-x-2">
            <button
              type="button"
              className={`px-4 py-2 rounded ${protocol === "hyperlane" ? "bg-blue-600" : "bg-gray-700"}`}
              onClick={() => setProtocol("hyperlane")}
            >
              Hyperlane
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded ${protocol === "layerzero" ? "bg-blue-600" : "bg-gray-700"}`}
              onClick={() => setProtocol("layerzero")}
            >
              LayerZero
            </button>
          </div>
        </div>

        <div>
          <label className="block mb-1">Source Chain</label>
          <select
            className="w-full p-2 bg-gray-700 rounded"
            value={sourceChain}
            onChange={(e) => setSourceChain(e.target.value)}
          >
            <option value="">Select source chain</option>
            {chains.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-center">
          <button type="button" className="p-2 bg-gray-700 rounded" onClick={handleSwapChains}>
            ⇄
          </button>
        </div>

        <div>
          <label className="block mb-1">Destination Chain</label>
          <select
            className="w-full p-2 bg-gray-700 rounded"
            value={destChain}
            onChange={(e) => setDestChain(e.target.value)}
          >
            <option value="">Select destination chain</option>
            {chains.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">Token</label>
          <select className="w-full p-2 bg-gray-700 rounded" value={token} onChange={(e) => setToken(e.target.value)}>
            <option value="">Select token</option>
            {tokens.map((token) => (
              <option key={token.id} value={token.id}>
                {token.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">Amount</label>
          <input
            type="text"
            className="w-full p-2 bg-gray-700 rounded"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Bridge Fee:</span>
            <span>{bridgeFee}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Estimated Time:</span>
            <span>{estimatedTime}</span>
          </div>
        </div>

        <button
          type="submit"
          className={`w-full py-2 rounded font-medium ${
            isConnected
              ? isLoading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-600 cursor-not-allowed"
          }`}
          disabled={!isConnected || isLoading}
        >
          {isLoading ? "Processing..." : isConnected ? "Bridge Assets" : "Connect Wallet to Bridge"}
        </button>
      </form>
    </div>
  )
}
