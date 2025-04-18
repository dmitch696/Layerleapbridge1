import Header from "@/components/header"
import Footer from "@/components/footer"
import StargateCompatibleBridge from "@/components/stargate-compatible-bridge"

export default function StargateCompatibleBridgePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-2">Stargate-Compatible Bridge</h1>
          <p className="text-gray-400 mb-8">Bridge your assets using the same parameters as Stargate</p>

          <div className="w-full max-w-md mb-6">
            <StargateCompatibleBridge />
          </div>

          <div className="max-w-2xl mx-auto mt-8 p-6 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold mb-4">About This Bridge</h2>
            <p className="mb-4">
              This bridge directly calls the LayerZero endpoint with the same parameters as Stargate Finance. This means
              that when you use MetaMask to confirm the transaction, you'll see the same parameters as you would when
              using Stargate.
            </p>

            <h3 className="text-lg font-bold mt-6 mb-2">How It Works</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Direct Endpoint Call:</strong> Instead of calling our own contract, we directly call the
                LayerZero endpoint contract
              </li>
              <li>
                <strong>Identical Parameters:</strong> We use the same function signature, destination address, payload
                format, and adapter parameters as Stargate
              </li>
              <li>
                <strong>Same Gas Settings:</strong> We use similar gas settings to ensure the transaction looks the same
                in MetaMask
              </li>
              <li>
                <strong>Cross-Chain Delivery:</strong> The message is delivered to the destination chain via LayerZero's
                infrastructure
              </li>
            </ol>

            <div className="mt-6 p-4 bg-purple-800/30 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> This is a demonstration of how to create transactions that look identical to
                Stargate in MetaMask. For a production bridge, you would need to implement proper security measures and
                error handling.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
