"use client"

import Header from "@/components/header"
import Footer from "@/components/footer"
import OptimizedBridge from "@/components/optimized-bridge"
import { useState } from "react"

export default function LayerZeroBridgePage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-2">LayerZero Bridge</h1>
          <p className="text-gray-400 mb-8">Bridge your assets across chains using the LayerZero protocol</p>

          <div className="w-full max-w-md mb-6">
            <OptimizedBridge />
          </div>

          <div className="max-w-2xl mx-auto mt-8 p-6 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Debug Information</h2>
            <p>Chain ID: {debugInfo?.chainId}</p>
            <p>Is Connected: {debugInfo?.isConnected ? "Yes" : "No"}</p>
            <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>

          <div className="max-w-2xl mx-auto mt-8 p-6 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold mb-4">About LayerZero</h2>
            <p className="mb-4">
              LayerZero is an omnichain interoperability protocol designed for lightweight cross-chain messaging. It
              enables secure and efficient transfer of assets between different blockchain networks.
            </p>

            <h3 className="text-lg font-bold mt-6 mb-2">How It Works</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Message Dispatch:</strong> A message is sent from the source chain through the LayerZero
                endpoint
              </li>
              <li>
                <strong>Oracle Verification:</strong> The Oracle verifies the block header of the source chain
              </li>
              <li>
                <strong>Relayer Delivery:</strong> The Relayer delivers the proof to the destination chain
              </li>
              <li>
                <strong>Message Processing:</strong> The message is processed on the destination chain, completing the
                transfer
              </li>
            </ol>

            <h3 className="text-lg font-bold mt-6 mb-2">Supported Chains</h3>
            <ul className="grid grid-cols-2 gap-2">
              <li className="flex items-center space-x-2">
                <span>🔷</span>
                <span>Ethereum</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>🔶</span>
                <span>Arbitrum</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>🟣</span>
                <span>Polygon</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>🔵</span>
                <span>Base</span>
              </li>
              <li className="flex items-center space-x-2">
                <span>❄️</span>
                <span>Avalanche</span>
              </li>
            </ul>

            <div className="mt-6 p-4 bg-blue-800/30 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> This bridge uses the deployed contract at
                0x2e04dD2F88AA6a88259c5006FD4C28312D5867B6 on Optimism. Transactions are processed via the LayerZero
                protocol and may take 10-30 minutes to complete.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
