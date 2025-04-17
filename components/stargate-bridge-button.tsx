"use client"

import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface StargateBridgeButtonProps {
  destinationChainId?: number
  amount?: string
  className?: string
}

export default function StargateBridgeButton({
  destinationChainId = 1, // Default to Ethereum
  amount = "0.01",
  className = "bg-purple-600 hover:bg-purple-700 font-medium",
}: StargateBridgeButtonProps) {
  const getStargateChainId = (evmChainId: number): string => {
    // Map EVM chain IDs to Stargate chain IDs
    const chainMap: Record<number, string> = {
      1: "1", // Ethereum
      10: "111", // Optimism
      42161: "110", // Arbitrum
      137: "109", // Polygon
      43114: "106", // Avalanche
      8453: "184", // Base
    }

    return chainMap[evmChainId] || "1" // Default to Ethereum if not found
  }

  const handleRedirect = () => {
    // Always use Optimism as source
    const srcChainId = "111" // Optimism in Stargate format
    const dstChainId = getStargateChainId(destinationChainId)

    // Construct URL with parameters
    const url = `https://stargate.finance/transfer?srcChainId=${srcChainId}&dstChainId=${dstChainId}&srcToken=ETH&dstToken=ETH&amount=${amount}`

    // Open in new tab
    window.open(url, "_blank")
  }

  return (
    <Button onClick={handleRedirect} className={`w-full ${className}`} variant="default">
      <ExternalLink className="mr-2 h-4 w-4" />
      Bridge via Stargate Finance
    </Button>
  )
}
