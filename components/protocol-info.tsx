"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProtocolInfo() {
  return (
    <div className="mt-16 mb-8">
      <h2 className="text-2xl font-bold text-center mb-8">Supported Bridge Protocols</h2>

      <Tabs defaultValue="hyperlane" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="hyperlane">Hyperlane</TabsTrigger>
          <TabsTrigger value="layerzero">LayerZero</TabsTrigger>
        </TabsList>

        <TabsContent value="hyperlane">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Hyperlane Protocol</CardTitle>
              <CardDescription>A secure and flexible interchain communication protocol</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Key Features</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Permissionless interchain messaging</li>
                    <li>Modular security model</li>
                    <li>Sovereign consensus</li>
                    <li>Customizable security</li>
                    <li>Developer-friendly APIs</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Supported Chains</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <span>🔷</span>
                      <span>Ethereum</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🔶</span>
                      <span>Arbitrum</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🔴</span>
                      <span>Optimism</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🟣</span>
                      <span>Polygon</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🔵</span>
                      <span>Base</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🔺</span>
                      <span>Avalanche</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">How It Works</h3>
                <p>
                  Hyperlane uses a modular security model that allows developers to customize security based on their
                  needs. The protocol consists of three main components:
                </p>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Mailbox contracts for sending and receiving messages</li>
                  <li>Validators that attest to messages on the source chain</li>
                  <li>Relayers that deliver messages to the destination chain</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layerzero">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>LayerZero Protocol</CardTitle>
              <CardDescription>
                An omnichain interoperability protocol for lightweight cross-chain messaging
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Key Features</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Ultra-light client messaging</li>
                    <li>Configurable security model</li>
                    <li>Trustless cross-chain communication</li>
                    <li>Low latency and cost</li>
                    <li>Composable with existing applications</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Supported Chains</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <span>🔷</span>
                      <span>Ethereum</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🔶</span>
                      <span>Arbitrum</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🔴</span>
                      <span>Optimism</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🟣</span>
                      <span>Polygon</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🔵</span>
                      <span>Base</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>🔺</span>
                      <span>Avalanche</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">How It Works</h3>
                <p>
                  LayerZero enables cross-chain messaging through a combination of on-chain endpoints and off-chain
                  relayers:
                </p>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>User initiates a transaction on the source chain</li>
                  <li>The LayerZero endpoint on the source chain emits an event</li>
                  <li>Oracle and relayer pick up the event and deliver it to the destination chain</li>
                  <li>The destination endpoint verifies the message and executes the intended function</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
