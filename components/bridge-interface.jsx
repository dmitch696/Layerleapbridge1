"use client"

import { useState, useEffect } from "react"

// Chain data with RPC URLs and explorer links
const chains = [
  {
    id: "ethereum",
    name: "Ethereum",
    chainId: 1,
    rpcUrl: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    explorer: "https://etherscan.io/tx/",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    chainId: 42161,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorer: "https://arbiscan.io/tx/",
  },
  {
    id: "optimism",
    name: "Optimism",
    chainId: 10,
    rpcUrl: "https://mainnet.optimism.io",
    explorer: "https://optimistic.etherscan.io/tx/",
  },
  {
    id: "polygon",
    name: "Polygon",
    chainId: 137,
    rpcUrl: "https://polygon-rpc.com",
    explorer: "https://polygonscan.com/tx/",
  },
  {
    id: "base",
    name: "Base",
    chainId: 8453,
    rpcUrl: "https://mainnet.base.org",
    explorer: "https://basescan.org/tx/",
  },
  {
    id: "avalanche",
    name: "Avalanche",
    chainId: 43114,
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    explorer: "https://snowtrace.io/tx/",
  },
]

// Token data with addresses
const tokens = [
  {
    id: "eth",
    name: "ETH",
    decimals: 18,
    isNative: true,
  },
  {
    id: "usdc",
    name: "USDC",
    decimals: 6,
    isNative: false,
  },
  {
    id: "usdt",
    name: "USDT",
    decimals: 6,
    isNative: false,
  },
  {
    id: "dai",
    name: "DAI",
    decimals: 18,
    isNative: false,
  },
]

export default function BridgeInterface() {
  const [protocol, setProtocol] = useState("hyperlane")
  const [sourceChain, setSourceChain] = useState("")
  const [destChain, setDestChain] = useState("")
  const [token, setToken] = useState("")
  const [amount, setAmount] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [txStatus, setTxStatus] = useState(null)
  const [bridgeFee, setBridgeFee] = useState("~0.0003 ETH")
  const [estimatedTime, setEstimatedTime] = useState("~15 minutes")

  // Check if wallet is connected
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const checkConnection = async () => {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
            setAddress(accounts[0])
            setIsConnected(true)

            // Get current chain ID
            const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
            setChainId(Number.parseInt(chainIdHex, 16))
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error)
        }
      }

      checkConnection()

      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setAddress(null)
          setIsConnected(false)
        } else {
          setAddress(accounts[0])
          setIsConnected(true)
        }
      }

      const handleChainChanged = (chainIdHex) => {
        setChainId(Number.parseInt(chainIdHex, 16))
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  // Set source chain based on connected network
  useEffect(() => {
    if (chainId) {
      const matchedChain = chains.find((c) => c.chainId === chainId)
      if (matchedChain) {
        setSourceChain(matchedChain.id)
      }
    }
  }, [chainId])

  // Update fee and time estimates when parameters change
  useEffect(() => {
    if (protocol === "hyperlane") {
      setEstimatedTime("~15 minutes")
    } else {
      setEstimatedTime("~10 minutes")
    }

    // Simple fee calculation based on destination chain
    if (destChain) {
      const destChainObj = chains.find((c) => c.id === destChain)
      if (destChainObj) {
        if (destChainObj.chainId === 1) {
          setBridgeFee("~0.0006 ETH") // Higher fee for Ethereum mainnet
        } else if ([42161, 10].includes(destChainObj.chainId)) {
          setBridgeFee("~0.0004 ETH") // Medium fee for L2s
        } else {
          setBridgeFee("~0.0003 ETH") // Lower fee for other chains
        }
      }
    }
  }, [protocol, destChain])

  const handleSwapChains = () => {
    const temp = sourceChain
    setSourceChain(destChain)
    setDestChain(temp)
  }

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)

          // Get current chain ID
          const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
          setChainId(Number.parseInt(chainIdHex, 16))

          alert("Wallet connected successfully")
        }
      } catch (error) {
        console.error("Error connecting wallet:", error)
        alert("Failed to connect wallet. Please try again.")
      }
    } else {
      alert("MetaMask is not installed. Please install MetaMask to use this feature.")
    }
  }

  const handleBridge = async (e) => {
    e.preventDefault()

    if (!isConnected) {
      await connectWallet()
      return
    }

    if (!sourceChain || !destChain || !token || !amount) {
      alert("Please fill in all fields")
      return
    }

    // Validate amount
    if (isNaN(Number.parseFloat(amount)) || Number.parseFloat(amount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    setIsLoading(true)
    setTxStatus(null)
    setTxHash(null)

    try {
      // Get objects for source chain, destination chain, and token
      const sourceChainObj = chains.find((c) => c.id === sourceChain)
      const destChainObj = chains.find((c) => c.id === destChain)
      const tokenObj = tokens.find((t) => t.id === token)

      if (!sourceChainObj || !destChainObj || !tokenObj) {
        throw new Error("Invalid selection")
      }

      // Simulate a delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate a mock transaction hash
      const mockTxHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
      setTxHash(mockTxHash)
      setTxStatus("success")

      alert(`Bridge transaction submitted! Tx: ${mockTxHash.slice(0, 10)}...${mockTxHash.slice(-8)}`)

      // Reset amount
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

      <form onSubmit={handleBridge} className="space-y-4">
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

        {txHash && (
          <div className="p-3 bg-gray-700 rounded text-sm">
            <p className="font-medium mb-1">Transaction Status: {txStatus}</p>
            <p className="truncate">
              Hash: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </p>
            {sourceChain && (
              <a
                href={`${chains.find((c) => c.id === sourceChain)?.explorer}${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline text-xs"
              >
                View on Explorer
              </a>
            )}
          </div>
        )}

        <button
          type="submit"
          className={`w-full py-2 rounded font-medium ${
            isLoading ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : isConnected ? "Bridge Assets" : "Connect Wallet"}
        </button>
      </form>
    </div>
  )
}
