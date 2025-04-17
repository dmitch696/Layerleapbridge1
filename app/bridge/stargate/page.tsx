import Header from "@/components/header"
import Footer from "@/components/footer"
import SimplifiedBridge from "@/components/simplified-bridge"

export default function StargateBridgePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-2">Stargate Bridge</h1>
          <p className="text-gray-400 mb-8">Bridge your assets across chains using Stargate Finance</p>

          <div className="w-full max-w-md mb-6">
            <SimplifiedBridge />
          </div>

          <div className="max-w-2xl mx-auto mt-8 p-6 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold mb-4">About Stargate Finance</h2>
            <p className="mb-4">
              Stargate is a fully composable liquidity transport protocol that lives at the heart of Omnichain DeFi. It
              solves the bridging trilemma with native asset transfers, unlimited and instant guaranteed finality, and
              unified liquidity across all chains.
            </p>

            <h3 className="text-lg font-bold mt-6 mb-2">Key Features</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Unified Liquidity:</strong> Combines liquidity from all chains into a single unified pool for
                efficient capital utilization
              </li>
              <li>
                <strong>Native Assets:</strong> Send native assets (not wrapped tokens) between chains
              </li>
              <li>
                <strong>Instant Guaranteed Finality:</strong> Transactions are finalized instantly with guarantees
              </li>
              <li>
                <strong>User-Friendly Interface:</strong> Simple and intuitive interface for cross-chain transfers
              </li>
            </ul>

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
                <span>🔴</span>
                <span>Optimism</span>
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

            <div className="mt-6 p-4 bg-purple-800/30 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> When using Stargate Finance, you'll be redirected to their interface to complete
                your transaction. This provides a seamless and highly reliable bridging experience.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
