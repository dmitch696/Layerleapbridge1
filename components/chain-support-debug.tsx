"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CHAINS, isChainSupported, getSupportedChains } from "@/services/optimized-bridge-service"
import { Loader2 } from "lucide-react"

export default function ChainSupportDebug() {
  const [web3, setWeb3] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [supportedChains, setSupportedChains] = useState<Record<number, boolean>>({})
  const [allSupportedChains, setAllSupportedChains] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

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

  const checkAllChains = async () => {
    if (!web3) return

    setIsLoading(true)
    setError(null)
    const supported: Record<number, boolean> = {}

    try {
      // Try to get all supported chains
      const supportedChainIds = await getSupportedChains()
      setAllSupportedChains(supportedChainIds)

      // Check each chain individually
      for (const chain of CHAINS) {
        try {
          const isSupported = await isChainSupported(chain.id)
          supported[chain.id] = isSupported
        } catch (chainError: any) {
          console.error(`Error checking chain ${chain.id}:`, chainError)
          supported[chain.id] = false
        }
      }

      setSupportedChains(supported)
    } catch (error: any) {
      console.error("Error checking chains:", error)
      setError(error.message || "Failed to check chain support")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl">Chain Support Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={checkAllChains} disabled={isLoading || !web3} className="w-full">
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking chains...
              </span>
            ) : (
              "Check Supported Chains"
            )}
          </Button>

          {error && (
            <div className="p-3 bg-red-800/50 rounded">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="mt-4">
            <h3 className="font-medium mb-2">All Supported Chains</h3>
            {allSupportedChains.length > 0 ? (
              <div className="p-3 bg-gray-700 rounded">
                {allSupportedChains.map((chainId) => (
                  <div key={chainId} className="text-sm">
                    Chain ID: {chainId} - {CHAINS.find((c) => c.id === chainId)?.name || "Unknown"}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No chains returned from getSupportedChains</p>
            )}
          </div>

          <div className="mt-4">
            <h3 className="font-medium mb-2">Individual Chain Support</h3>
            <div className="space-y-2">
              {CHAINS.map((chain) => (
                <div key={chain.id} className="p-2 bg-gray-700 rounded flex justify-between items-center">
                  <span>
                    {chain.logo} {chain.name} (ID: {chain.id})
                  </span>
                  <span className={supportedChains[chain.id] ? "text-green-400" : "text-red-400"}>
                    {supportedChains[chain.id] ? "Supported" : "Not Supported"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
