import Link from "next/link"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Bridge Your Assets Across Chains</h1>
          <p className="text-xl text-gray-300 mb-8">
            LayerLeap provides a secure and efficient way to transfer your assets between different blockchain networks.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/bridge">
              <Button size="lg" className="w-full sm:w-auto">
                Launch Bridge
              </Button>
            </Link>
            <Link href="#" target="_blank">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Read Documentation
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-3">Fast Transfers</h3>
            <p className="text-gray-300">Experience quick cross-chain transfers with optimized bridge protocols.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-3">Secure & Reliable</h3>
            <p className="text-gray-300">Built on battle-tested protocols with robust security measures.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-3">Multiple Chains</h3>
            <p className="text-gray-300">Support for all major EVM-compatible blockchains and L2 networks.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
