"use client"

import { useState } from "react"
import { CONTRACT_ADDRESSES } from "@/config/contracts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContractInfo() {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Contract Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>
            <span className="text-gray-400">Bridge Contract:</span>{" "}
            <a
              href={`https://optimistic.etherscan.io/address/${CONTRACT_ADDRESSES.LAYER_ZERO_BRIDGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline break-all"
            >
              {CONTRACT_ADDRESSES.LAYER_ZERO_BRIDGE}
            </a>
          </p>
          <p className="text-xs text-gray-400">
            This contract handles the bridging of assets from Optimism to other chains via LayerZero protocol.
          </p>

          <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)} className="mt-2">
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>

          {showDetails && (
            <div className="mt-3 space-y-2 text-sm">
              <p>
                <span className="text-gray-400">Network:</span> Optimism
              </p>
              <p>
                <span className="text-gray-400">Protocol:</span> LayerZero
              </p>
              <p>
                <span className="text-gray-400">Contract Type:</span> Bridge
              </p>
              <p>
                <span className="text-gray-400">Verification Status:</span>{" "}
                <span className="text-green-400">Verified</span>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                The contract is deployed on Optimism and uses LayerZero's messaging protocol to facilitate cross-chain
                transfers.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
