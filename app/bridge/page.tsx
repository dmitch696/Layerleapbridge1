import Header from "@/components/header"
import Footer from "@/components/footer"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function BridgePage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Choose Your Bridge
            </span>
          </h1>
          <p className="text-gray-400 mb-8">Select a bridge protocol that fits your needs</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
            <Card className="bg-gray-900 border-gray-800 hover:border-blue-500 transition-colors">
              <CardHeader>
                <CardTitle>LayerZero Bridge</CardTitle>
                <CardDescription>Fast transfers with ultra-light client validation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-400">
                  LayerZero provides trustless cross-chain messaging with low latency and cost.
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs bg-blue-900/50 py-1 px-2 rounded">Fee: Low-Medium</span>
                  </div>
                  <Link href="/bridge/layerzero">
                    <Button variant="outline" className="border-blue-500 hover:bg-blue-900/20">
                      Select
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 hover:border-green-500 transition-colors">
              <CardHeader>
                <CardTitle>Hyperlane Bridge</CardTitle>
                <CardDescription>Secure interchain communication with modular security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-400">
                  Hyperlane offers permissionless messaging with customizable security for your assets.
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs bg-green-900/50 py-1 px-2 rounded">Fee: Medium</span>
                  </div>
                  <Link href="/bridge/hyperlane">
                    <Button variant="outline" className="border-green-500 hover:bg-green-900/20">
                      Select
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 hover:border-purple-500 transition-colors">
              <CardHeader>
                <CardTitle>Stargate Bridge</CardTitle>
                <CardDescription>User-friendly bridging with unified liquidity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-400">
                  Stargate combines liquidity from all chains into a single unified pool for efficient bridging.
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs bg-purple-900/50 py-1 px-2 rounded">Fee: Medium-High</span>
                  </div>
                  <Link href="/bridge/stargate">
                    <Button variant="outline" className="border-purple-500 hover:bg-purple-900/20">
                      Select
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 hover:border-purple-500 transition-colors">
              <CardHeader>
                <CardTitle>Stargate-Compatible Bridge</CardTitle>
                <CardDescription>Direct LayerZero transactions with Stargate parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-400">
                  This bridge directly calls the LayerZero endpoint with the same parameters as Stargate.
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs bg-purple-900/50 py-1 px-2 rounded">Advanced</span>
                  </div>
                  <Link href="/bridge/stargate-compatible">
                    <Button variant="outline" className="border-purple-500 hover:bg-purple-900/20">
                      Select
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 w-full max-w-3xl">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>About Our Bridge Options</CardTitle>
                <CardDescription>Each bridge operates independently with its own protocol</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-400">
                  We offer multiple bridge options, each using a different protocol. These bridges operate independently
                  and do not fall back to each other. Choose the bridge that best suits your specific needs based on
                  security, speed, and cost considerations.
                </p>

                <div className="mt-4 space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-600 p-2 rounded-full">
                      <span className="text-white">1</span>
                    </div>
                    <div>
                      <h3 className="font-medium">LayerZero</h3>
                      <p className="text-sm text-gray-400">
                        Best for fast transfers with lower fees. Uses ultra-light client messaging.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-green-600 p-2 rounded-full">
                      <span className="text-white">2</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Hyperlane</h3>
                      <p className="text-sm text-gray-400">
                        Best for security-focused transfers. Uses a modular security model with validators.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-600 p-2 rounded-full">
                      <span className="text-white">3</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Stargate</h3>
                      <p className="text-sm text-gray-400">
                        Best for user-friendly experience. Uses unified liquidity pools across chains.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
