import Link from "next/link"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import Footer from "@/components/footer"
import BridgeForm from "@/components/bridge-form"
import EthereumLogo from "@/components/logos/ethereum-logo"
import OptimismLogo from "@/components/logos/optimism-logo"
import ArbitrumLogo from "@/components/logos/arbitrum-logo"
import PolygonLogo from "@/components/logos/polygon-logo"
import BaseLogo from "@/components/logos/base-logo"
import AvalancheLogo from "@/components/logos/avalanche-logo"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-purple-900/20" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2 space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    Bridge assets
                  </span>{" "}
                  across chains
                </h1>
                <p className="text-lg text-gray-300 max-w-xl">
                  LayerLeap provides a fast, secure, and cost-effective way to transfer your assets between different
                  blockchain networks.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/bridge">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      Launch Bridge
                    </Button>
                  </Link>
                  <Link href="#supported-chains">
                    <Button size="lg" variant="outline" className="border-gray-700 hover:bg-gray-800">
                      Supported Chains
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="lg:w-1/2">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl">
                  <BridgeForm />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-900/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Why Choose LayerLeap
              </span>
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Fast Transfers</h3>
                <p className="text-gray-400">Experience quick cross-chain transfers with optimized bridge protocols.</p>
              </div>

              <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-purple-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Secure & Reliable</h3>
                <p className="text-gray-400">Built on battle-tested protocols with robust security measures.</p>
              </div>

              <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Low Fees</h3>
                <p className="text-gray-400">Competitive fee structure to maximize your cross-chain transfers.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Chains Section */}
        <section id="supported-chains" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Supported Chains
              </span>
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                <EthereumLogo className="h-12 w-12 mb-3" />
                <h3 className="text-lg font-medium">Ethereum</h3>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                <OptimismLogo className="h-12 w-12 mb-3" />
                <h3 className="text-lg font-medium">Optimism</h3>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                <ArbitrumLogo className="h-12 w-12 mb-3" />
                <h3 className="text-lg font-medium">Arbitrum</h3>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                <PolygonLogo className="h-12 w-12 mb-3" />
                <h3 className="text-lg font-medium">Polygon</h3>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                <BaseLogo className="h-12 w-12 mb-3" />
                <h3 className="text-lg font-medium">Base</h3>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                <AvalancheLogo className="h-12 w-12 mb-3" />
                <h3 className="text-lg font-medium">Avalanche</h3>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to bridge your assets?</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
              Start transferring your assets across chains with LayerLeap's secure and efficient bridge.
            </p>
            <Link href="/bridge">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Launch Bridge
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
