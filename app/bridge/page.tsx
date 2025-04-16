import Header from "@/components/header"
import Footer from "@/components/footer"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function BridgePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-2">Bridge Your Assets</h1>
          <p className="text-gray-400 mb-8">Choose a bridge protocol to transfer your assets across chains</p>

          <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
            <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-colors">
              <CardHeader>
                <CardTitle>LayerZero Bridge</CardTitle>
                <CardDescription>Bridge assets using the LayerZero protocol</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  LayerZero provides a secure and efficient way to transfer assets between chains with ultra-light
                  client messaging.
                </p>
                <Link href="/bridge/layerzero">
                  <Button className="w-full">Use LayerZero Bridge</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:border-purple-500 transition-colors">
              <CardHeader>
                <CardTitle>Hyperlane Bridge</CardTitle>
                <CardDescription>Bridge assets using the Hyperlane protocol</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Hyperlane offers a modular interchain security protocol for seamless asset transfers across blockchain
                  networks.
                </p>
                <Button className="w-full" variant="outline" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 p-6 bg-gray-800 rounded-lg max-w-4xl w-full">
            <h2 className="text-xl font-bold mb-4">Why Use Our Bridge?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-bold mb-2">Secure</h3>
                <p className="text-gray-300">
                  Built on battle-tested protocols with robust security measures to ensure your assets are safe.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Fast</h3>
                <p className="text-gray-300">Experience quick cross-chain transfers with optimized bridge protocols.</p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2">Low Fees</h3>
                <p className="text-gray-300">Competitive fee structure with transparent pricing and no hidden costs.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
