import ImprovedBridge from "@/components/improved-bridge"
import ContractInfo from "@/components/contract-info"
import Header from "@/components/header"
import Footer from "@/components/footer"

export default function LayerZeroBridgePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-2">LayerZero Bridge</h1>
          <p className="text-gray-400 mb-8">Bridge your assets across chains using LayerZero protocol</p>

          <div className="w-full max-w-md mb-6">
            <ImprovedBridge />
          </div>

          <div className="w-full max-w-md mb-12">
            <ContractInfo />
          </div>

          <div className="max-w-2xl mx-auto mt-8 p-6 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold mb-4">About LayerZero Bridge</h2>
            <p className="mb-4">
              LayerZero is an omnichain interoperability protocol designed for lightweight cross-chain messaging. It
              enables secure and efficient transfer of assets between different blockchain networks.
            </p>

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

            <h3 className="text-lg font-bold mt-6 mb-2">How It Works</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Connect your wallet to Optimism network</li>
              <li>Select your destination chain</li>
              <li>Enter the amount of ETH you want to bridge</li>
              <li>Specify the recipient address on the destination chain</li>
              <li>Submit the transaction and approve it in your wallet</li>
              <li>Wait for the bridging process to complete (10-30 minutes)</li>
            </ol>

            <div className="mt-6 p-4 bg-yellow-800/30 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> Bridging assets across chains involves network fees. The estimated fee shown
                includes gas costs for both the source and destination chains.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
