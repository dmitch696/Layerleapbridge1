import Header from "@/components/header"
import Footer from "@/components/footer"
import LayerZeroDirectBridge from "@/components/layerzero-direct-bridge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function BridgePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-2">Bridge Your Assets</h1>
          <p className="text-gray-400 mb-8">Transfer your assets from Optimism to other chains</p>

          <div className="w-full max-w-md mb-8">
            <LayerZeroDirectBridge />
          </div>

          <div className="w-full max-w-md">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>Understanding the bridge process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-600 p-2 rounded-full">1</div>
                  <div>
                    <h3 className="font-medium">Connect Wallet</h3>
                    <p className="text-sm text-gray-400">Connect your MetaMask wallet to the Optimism network.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-600 p-2 rounded-full">2</div>
                  <div>
                    <h3 className="font-medium">Select Destination</h3>
                    <p className="text-sm text-gray-400">Choose which chain you want to bridge your assets to.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-600 p-2 rounded-full">3</div>
                  <div>
                    <h3 className="font-medium">Initiate Bridge</h3>
                    <p className="text-sm text-gray-400">
                      Click the bridge button to send a test amount (0.0001 ETH) to your destination chain.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-600 p-2 rounded-full">4</div>
                  <div>
                    <h3 className="font-medium">Wait for Confirmation</h3>
                    <p className="text-sm text-gray-400">
                      The bridge process typically takes 10-30 minutes to complete.
                    </p>
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
