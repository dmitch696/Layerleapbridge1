"use client"

import { Button } from "@/components/ui/button"
import { bridgeViaStargate } from "@/services/stargate-bridge-service"

interface StargateBridgeButtonProps {
  destinationChainId: number
  amount: string
}

export default function StargateBridgeButton({ destinationChainId, amount }: StargateBridgeButtonProps) {
  const handleBridge = () => {
    // Source chain is always Optimism (10)
    bridgeViaStargate(10, destinationChainId, amount)
  }

  return (
    <Button onClick={handleBridge} className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
      Use Stargate Bridge Instead
    </Button>
  )
}
