"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useNotifications } from "./notifications-container"

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
    addresses: {
      1: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH
      42161: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH on Arbitrum
      10: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH on Optimism
      137: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH on Polygon
      8453: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH on Base
      43114: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB", // WETH on Avalanche
    },
  },
  {
    id: "usdc",
    name: "USDC",
    decimals: 6,
    isNative: false,
    addresses: {
      1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
      42161: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", // USDC on Arbitrum
      10: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // USDC on Optimism
      137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // USDC on Polygon
      8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
      43114: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", // USDC on Avalanche
    },
  },
  {
    id: "usdt",
    name: "USDT",
    decimals: 6,
    isNative: false,
    addresses: {
      1: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT on Ethereum
      42161: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", // USDT on Arbitrum
      10: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", // USDT on Optimism
      137: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", // USDT on Polygon
      8453: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", // USDT on Base
      43114: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", // USDT on Avalanche
    },
  },
  {
    id: "dai",
    name: "DAI",
    decimals: 18,
    isNative: false,
    addresses: {
      1: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI on Ethereum
      42161: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI on Arbitrum
      10: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", // DAI on Optimism
      137: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063", // DAI on Polygon
      8453: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", // DAI on Base
      43114: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70", // DAI on Avalanche
    },
  },
]

// Hyperlane domain IDs (different from EVM chain IDs)
const hyperlaneDomains = {
  1: 1, // Ethereum
  42161: 42161, // Arbitrum
  10: 10, // Optimism
  137: 137, // Polygon
  8453: 8453, // Base
  43114: 43114, // Avalanche
}

// LayerZero chain IDs (different from EVM chain IDs)
const layerZeroChainIds = {
  1: 101, // Ethereum
  42161: 110, // Arbitrum
  10: 111, // Optimism
  137: 109, // Polygon
  8453: 184, // Base
  43114: 106, // Avalanche
}

// Fee collector contract addresses (deployed on each chain)
const feeCollectorAddresses = {
  1: "0x3F919B89a03c546BCe66120616F13461578FD8Ff", // Your wallet address for Ethereum
  42161: "0x3F919B89a03c546BCe66120616F13461578FD8Ff", // Your wallet address for Arbitrum
  10: "0xEa26A7813E4CE4836D0242fE7E3835716970c883", // Your new SimpleBridge contract on Optimism
  137: "0x3F919B89a03c546BCe66120616F13461578FD8Ff", // Your wallet address for Polygon
  8453: "0x3F919B89a03c546BCe66120616F13461578FD8Ff", // Your wallet address for Base
  43114: "0x3F919B89a03c546BCe66120616F13461578FD8Ff", // Your wallet address for Avalanche
}

// Fee collector ABI
const feeCollectorAbi = [
  {
    inputs: [
      {
        name: "destinationChainId",
        type: "uint32",
      },
      {
        name: "recipient",
        type: "address",
      },
    ],
    name: "bridgeNativeViaHyperlane",
    outputs: [
      {
        name: "messageId",
        type: "bytes32",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        name: "destinationChainId",
        type: "uint16",
      },
      {
        name: "recipient",
        type: "bytes",
      },
      {
        name: "adapterParams",
        type: "bytes",
      },
    ],
    name: "bridgeNativeViaLayerZero",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]

// ERC20 ABI for token approvals
const erc20Abi = [
  {
    constant: false,
    inputs: [
      {
        name: "spender",
        type: "address",
      },
      {
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        name: "",
        type: "bool",
      },
    ],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    constant: true,
    inputs: [
      {
        name: "owner",
        type: "address",
      },
      {
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
]

// Helper function to format amounts with decimals
function parseAmount(amount, decimals) {
  // Remove any commas
  amount = amount.replace(/,/g, "")

  // Convert to BigInt with proper decimals
  const parts = amount.split(".")
  let result = parts[0]

  if (parts.length > 1) {
    let fraction = parts[1]
    // Pad with zeros if needed
    if (fraction.length < decimals) {
      fraction = fraction.padEnd(decimals, "0")
    } else if (fraction.length > decimals) {
      fraction = fraction.substring(0, decimals)
    }
    result += fraction
  } else {
    // No decimal point, add zeros
    result += "0".repeat(decimals)
  }

  return result
}

// Helper function to properly encode hex data without 0x prefix
function encodeHex(value, byteLength) {
  // Convert to hex and remove 0x prefix if present
  let hex = value.toString(16)

  // Pad with zeros to the required byte length
  hex = hex.padStart(byteLength * 2, "0")

  return hex
}

export default function BridgeInterface() {
  const { addNotification } = useNotifications()
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
  const [platformFeeInfo, setPlatformFeeInfo] = useState("50% of fees support platform development")

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

          addNotification("Wallet connected successfully", "success")
        }
      } catch (error) {
        console.error("Error connecting wallet:", error)
        addNotification("Failed to connect wallet. Please try again.", "error")
      }
    } else {
      addNotification("MetaMask is not installed. Please install MetaMask to use this feature.", "error")
    }
  }

  // Check token allowance
  const checkAllowance = async (tokenObj, sourceChainObj, spenderAddress) => {
    try {
      const tokenAddress = tokenObj.addresses[sourceChainObj.chainId.toString()]

      // Call allowance function on token contract
      const data = {
        to: tokenAddress,
        data: `0xdd62ed3e000000000000000000000000${address.substring(2)}000000000000000000000000${spenderAddress.substring(2)}`,
      }

      const allowanceHex = await window.ethereum.request({
        method: "eth_call",
        params: [data, "latest"],
      })

      // Convert hex to decimal
      const allowance = Number.parseInt(allowanceHex, 16)
      const amountValue = Number.parseFloat(amount) * 10 ** tokenObj.decimals

      return allowance >= amountValue
    } catch (error) {
      console.error("Error checking allowance:", error)
      return false
    }
  }

  // Approve token spending
  const approveToken = async (tokenObj, sourceChainObj, spenderAddress) => {
    try {
      const tokenAddress = tokenObj.addresses[sourceChainObj.chainId.toString()]
      const amountToApprove = `0x${"f".repeat(64)}` // Max uint256

      // Encode approve function call
      const data = `0x095ea7b3000000000000000000000000${spenderAddress.substring(2)}${amountToApprove.substring(2)}`

      // Send transaction
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: tokenAddress,
            data: data,
          },
        ],
      })

      addNotification("Approval transaction submitted", "info")

      // Wait for transaction to be mined
      let receipt = null
      while (!receipt) {
        try {
          receipt = await window.ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [txHash],
          })

          if (!receipt) {
            await new Promise((resolve) => setTimeout(resolve, 3000))
          }
        } catch (error) {
          console.error("Error getting receipt:", error)
          await new Promise((resolve) => setTimeout(resolve, 3000))
        }
      }

      if (receipt.status === "0x1") {
        addNotification("Token approval successful", "success")
        return true
      } else {
        addNotification("Token approval failed", "error")
        return false
      }
    } catch (error) {
      console.error("Error approving token:", error)
      addNotification(`Approval failed: ${error.message}`, "error")
      return false
    }
  }

  // Execute bridge transaction
  const executeBridgeTransaction = async (sourceChainObj, destChainObj, tokenObj) => {
    try {
      // Get fee collector address for the current chain
      const feeCollectorAddress = feeCollectorAddresses[sourceChainObj.chainId.toString()]
      const tokenAddress = tokenObj.addresses[sourceChainObj.chainId.toString()]
      const parsedAmount = parseAmount(amount, tokenObj.decimals)

      const txParams = {
        from: address,
        to: feeCollectorAddress,
      }

      // Encode function call based on protocol and token type
      if (tokenObj.isNative) {
        // For native token (ETH)
        const totalValue = 0.0003 * 10 ** 18 + Number.parseFloat(amount) * 10 ** 18
        txParams.value = "0x" + Math.floor(totalValue).toString(16)

        if (protocol === "hyperlane") {
          // Use bridgeNativeViaHyperlane
          // Function selector for bridgeNativeViaHyperlane: 0x3b3a5522
          const destChainIdHex = destChainObj.chainId.toString(16).padStart(64, "0")

          // Encode the recipient address (needs to be padded to 32 bytes)
          const recipientHex = "000000000000000000000000" + address.substring(2).toLowerCase()

          // Combine all parts
          txParams.data = `0x3b3a5522${destChainIdHex}${recipientHex}`
        } else {
          // Use bridgeNativeViaLayerZero
          // Function selector for bridgeNativeViaLayerZero: 0x9e40b315
          const lzChainId = layerZeroChainIds[destChainObj.chainId.toString()]
          const lzChainIdHex = lzChainId.toString(16).padStart(64, "0")

          // For LayerZero, we need to encode the recipient as bytes
          // First 32 bytes: offset to the bytes data (32)
          const offsetHex = "0000000000000000000000000000000000000000000000000000000000000020"

          // Next 32 bytes: length of the bytes data (20 for address)
          const lengthHex = "0000000000000000000000000000000000000000000000000000000000000014"

          // Next 32 bytes: the address itself, padded to 32 bytes
          const recipientHex = "000000000000000000000000" + address.substring(2).toLowerCase()

          // Empty adapter params
          // First 32 bytes: offset to the bytes data (96 = 32*3)
          const paramsOffsetHex = "0000000000000000000000000000000000000000000000000000000000000060"

          // Next 32 bytes: length of the bytes data (0)
          const paramsLengthHex = "0000000000000000000000000000000000000000000000000000000000000000"

          // Combine all parts
          txParams.data = `0x9e40b315${lzChainIdHex}${offsetHex}${lengthHex}${recipientHex}${paramsOffsetHex}${paramsLengthHex}`
        }
      } else {
        // For ERC20 tokens - not implemented in this simplified version
        addNotification("ERC20 token bridging is not yet implemented", "error")
        throw new Error("ERC20 token bridging is not yet implemented")
      }

      // Send transaction
      const hash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      })

      setTxHash(hash)
      setTxStatus("pending")

      // Get explorer URL for the source chain
      const explorerUrl = sourceChainObj.explorer + hash

      addNotification(`Bridge transaction submitted! View on explorer: ${explorerUrl.substring(0, 30)}...`, "success")

      return hash
    } catch (error) {
      console.error("Error executing bridge transaction:", error)
      addNotification(`Bridge failed: ${error.message}`, "error")
      throw error
    }
  }

  const handleBridge = async (e: React.FormEvent<HTMLFormElement>) => {
   e.preventDefault()

   if (!isConnected) {
     await connectWallet()
     return
   }

   if (!sourceChain || !destChain || !token || !amount) {
     addNotification("Please fill in all fields", "error")
     return
   }

   // Validate amount
   if (isNaN(Number.parseFloat(amount)) || Number.parseFloat(amount) <= 0) {
     addNotification("Please enter a valid amount", "error")
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

     // Switch network if needed
     if (chainId !== sourceChainObj.chainId) {
       try {
         addNotification(`Switching to ${sourceChainObj.name} network...`, "info")

         // Check if the chain is already added to MetaMask
         try {
           await window.ethereum.request({
             method: "wallet_switchEthereumChain",
             params: [{ chainId: `0x${sourceChainObj.chainId.toString(16)}` }],
           })
         } catch (switchError: any) {
           // Chain not added, add it
           if (switchError.code === 4902) {
             await window.ethereum.request({
               method: "wallet_addEthereumChain",
               params: [
                 {
                   chainId: `0x${sourceChainObj.chainId.toString(16)}`,
                   chainName: sourceChainObj.name,
                   nativeCurrency: {
                     name: "Ether",
                     symbol: "ETH",
                     decimals: 18,
                   },
                   rpcUrls: [sourceChainObj.rpcUrl],
                   blockExplorerUrls: [sourceChainObj.explorer.replace("/tx/", "")],
                 },
               ],
             })
           } else {
             throw switchError
           }
         }

         // Update chainId after switching
         const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
         setChainId(Number.parseInt(chainIdHex, 16))
       } catch (error) {
         console.error("Failed to switch network:", error)
         addNotification("Failed to switch network. Please try again.", "error")
         setIsLoading(false)
         return
       }
     }

     // For non-native tokens, check allowance and approve if needed
     if (!tokenObj.isNative) {
       // We need to approve the fee collector contract
       const feeCollectorAddress = feeCollectorAddresses[sourceChainObj.chainId.toString()]

       addNotification("Checking token allowance...", "info")
       const hasAllowance = await checkAllowance(tokenObj, sourceChainObj, feeCollectorAddress)

       if (!hasAllowance) {
         addNotification("Token approval required", "info")
         const approved = await approveToken(tokenObj, sourceChainObj, feeCollectorAddress)

         if (!approved) {
           setIsLoading(false)
           return
         }
       }
     }

     // Execute bridge transaction
     await executeBridgeTransaction(sourceChainObj, destChainObj, tokenObj)

     // Reset amount
     setAmount("")
   } catch (error) {
     console.error("Bridge error:", error)
     addNotification(`Bridge failed: ${error.message}`, "error")
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
          <div className="text-gray-400 text-xs italic mt-1">{platformFeeInfo}</div>
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
