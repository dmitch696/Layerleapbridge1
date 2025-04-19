"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { isConnectedToOptimism, switchToOptimism } from "@/utils/network-utils"
import { CHAINS, bridgeETH, isChainSupported } from "@/services/resilient-bridge-service"
import { useWallet } from "@/hooks/use-wallet"

export default function OptimizedBridge() {
  const { toast } = useToast()
  const [destinationChain, setDestinationChain] = useState("")
  const [amount, setAmount] = useState("0.01")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(true)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { isConnected: walletIsConnected, chainId, isMetaMaskAvailable, setIsConnected } = useWallet()
  const [web3, setWeb3] = useState<any>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [fee, setFee] = useState<string | null>(null)
  const [supportedChains, setSupportedChains] = useState<Record<number, boolean>>({})
  const [isCheckingSupport, setIsCheckingSupport] = useState(false)
  const [networkCheckAttempts, setNetworkCheckAttempts] = useState(0)
  const [manualChainId, setManualChainId] = useState<number | null>(null)
  const [isOnOptimism, setIsOnOptimism] = useState(false)

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
            try {
              const onOptimism = await isConnectedToOptimism()
              console.log("Is on Optimism:", onOptimism)
              setIsOnOptimism(onOptimism)
            } catch (e) {
              console.error("Error checking Optimism connection", e)
            }

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
      const handleAccountsChanged = (accounts: string[]) => {
        setIsConnected(accounts.length > 0)
        if (accounts.length > 0) {
          setAccount(accounts[0])

          // Reset network check attempts when accounts change
          setNetworkCheckAttempts(0)

          // Check if on Optimism
          try {
            isConnectedToOptimism().then((onOptimism) => {
              setIsOnOptimism(onOptimism)
            })
          } catch (e) {
            console.error("Error checking Optimism connection", e)
          }

          // Get account balance if web3 is initialized
          if (web3) {
            try {
              web3.eth.getBalance(accounts[0]).then((balanceWei) => {
                const balanceEth = web3.utils.fromWei(balanceWei, "ether")
                setBalance(balanceEth)
              })
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

      const handleChainChanged = (chainIdHex: string) => {
        console.log("Chain changed to:", chainIdHex)
        setManualChainId(Number.parseInt(chainIdHex, 16))

        // Reset network check attempts when chain changes
        setNetworkCheckAttempts(0)

        // Check if on Optimism
        try {
          isConnectedToOptimism().then((onOptimism) => {
            setIsOnOptimism(onOptimism)
          })
        } catch (e) {
          console.error("Error checking Optimism connection", e)
        }

        // Update balance if account exists and web3 is initialized
        if (web3 && account) {
          try {
            web3.eth.getBalance(account).then((balanceWei) => {
              const balanceEth = web3.utils.fromWei(balanceWei, "ether")
              setBalance(balanceEth)
            })
          } catch (balanceError) {
            console.error("Error getting balance:", balanceError)
          }
        }
      }

      try {
        window.ethereum.on("accountsChanged", handleAccountsChanged)
        window.ethereum.on("chainChanged", handleChainChanged)
      } catch (e) {
        console.error("Error setting up event listeners", e)
      }

      // Cleanup
      return () => {
        if (window.ethereum) {
          try {
            window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
            window.ethereum.removeListener("chainChanged", handleChainChanged)
          } catch (e) {
            console.error("Error removing event listeners", e)
          }
        }
      }
    }
  }, [web3, account, networkCheckAttempts])

  // Retry network check if not on Optimism
  useEffect(() => {
    if (walletIsConnected && !isOnOptimism && networkCheckAttempts < 3) {
      const timer = setTimeout(() => {
        console.log("Retrying network check, attempt:", networkCheckAttempts + 1)
        setNetworkCheckAttempts((prev) => prev + 1)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [walletIsConnected, isOnOptimism, networkCheckAttempts])

  // Check which chains are supported
  useEffect(() => {
    async function checkSupportedChains() {
      if (!walletIsConnected) return

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
  }, [walletIsConnected, isOnOptimism])

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

        // Reset network check attempts
        setNetworkCheckAttempts(0)

        // Check if on Optimism
        try {
          const onOptimism = await isConnectedToOptimism()
          setIsOnOptimism(onOptimism)
        } catch (e) {
          console.error("Error checking Optimism connection", e)
        }
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

  const forceNetworkRefresh = async () => {
    setIsCheckingNetwork(true)

    try {
      // Force a network check
      const onOptimism = await isConnectedToOptimism()
      setIsOnOptimism(onOptimism)

      if (onOptimism) {
        toast({
          title: "Network Detected",
          description: "Successfully detected Optimism network.",
        })
      } else {
        // Try to switch to Optimism
        const switched = await switchToOptimism()
        if (switched) {
          setIsOnOptimism(true)
          toast({
            title: "Network Switched",
            description: "Successfully switched to Optimism network.",
          })
        } else {
          toast({
            title: "Network Switch Failed",
            description: "Could not switch to Optimism network. Please try manually switching in your wallet.",
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      toast({
        title: "Network Check Failed",
        description: error.message || "Failed to check network",
        variant: "destructive",
      })
    } finally {
      setIsCheckingNetwork(false)
    }
  }

  const handleManualChainIdCheck = async () => {
    if (window.ethereum) {
      try {
        const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
        const chainId = Number.parseInt(chainIdHex, 16)
        setManualChainId(chainId)
        toast({
          title: "Manual Chain ID Check",
          description: `Detected Chain ID: ${chainId}`,
        })
      } catch (error: any) {
        toast({
          title: "Manual Chain ID Check Failed",
          description: error.message || "Failed to get chain ID",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to use this feature.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setTxHash(null)

    try {
      // Check if connected
      if (!walletIsConnected) {
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

      const result = await bridgeETH(Number.parseInt(destinationChain), amount)

      if (result.success && result.txHash) {
        setTxHash(result.txHash)
        toast({
          title: "Bridge Transaction Submitted",
          description: "Your assets are being bridged. This may take 10-30 minutes to complete.",
        })
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

          {walletIsConnected && !isOnOptimism && (
            <div className="p-3 bg-yellow-900/30 rounded mb-4">
              <p className="text-sm text-yellow-400">
                Network detection issue. You appear to be connected to Optimism, but our app can't detect it.
              </p>
              <Button
                onClick={forceNetworkRefresh}
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                disabled={isCheckingNetwork}
              >
                {isCheckingNetwork ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </span>
                ) : (
                  "Refresh Network Status"
                )}
              </Button>
            </div>
          )}

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
                <option
                  key={chain.id}
                  value={chain.id}
                  disabled={walletIsConnected && supportedChains[chain.id] === false}
                >
                  {chain.logo} {chain.name}
                  {walletIsConnected && supportedChains[chain.id] === false ? " (Not Supported)" : ""}
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

          <Button type="submit" className="w-full" disabled={isLoading || isCheckingNetwork || !isMetaMaskAvailable}>
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </span>
            ) : !walletIsConnected && isMetaMaskAvailable ? (
              "Connect Wallet"
            ) : !isMetaMaskAvailable ? (
              "MetaMask Not Available"
            ) : !isOnOptimism ? (
              "Switch to Optimism"
            ) : (
              "Bridge ETH via LayerZero"
            )}
          </Button>
        </form>

        <Button variant="secondary" onClick={handleManualChainIdCheck} disabled={isLoading}>
          Check Chain ID
        </Button>
        {manualChainId && <p>Detected Chain ID: {manualChainId}</p>}

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
