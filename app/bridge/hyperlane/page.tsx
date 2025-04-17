import Header from "@/components/header"
import Footer from "@/components/footer"
import HyperlaneBridge from "@/components/hyperlane-bridge"

export default function HyperlaneBridgePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-2">Hyperlane Bridge</h1>
          <p className="text-gray-400 mb-8">Bridge your assets across chains using the Hyperlane protocol</p>

          <div className="w-full max-w-md mb-6">
            <HyperlaneBridge />
          </div>

          <div className="max-w-2xl mx-auto mt-8 p-6 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold mb-4">About Hyperlane</h2>
            <p className="mb-4">
              Hyperlane is a permissionless interchain messaging protocol that enables secure communication between
              blockchains. It uses a modular security model that allows developers to customize security based on their
              specific needs.
            </p>

            <h3 className="text-lg font-bold mt-6 mb-2">How Hyperlane Works</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Message Dispatch:</strong> A message is sent from the source chain through the Hyperlane Mailbox
                contract
              </li>
              <li>
                <strong>Validator Attestation:</strong> Validators observe and attest to the message on the source chain
              </li>
              <li>
                <strong>Message Relay:</strong> Relayers deliver the message and attestations to the destination chain
              </li>
              <li>
                <strong>Message Processing:</strong> The message is processed on the destination chain, completing the
                transfer
              </li>
            </ol>

            <h3 className="text-lg font-bold mt-6 mb-2">Key Features</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Modular Security:</strong> Customize security based on your specific needs and risk tolerance
              </li>
              <li>
                <strong>Permissionless Messaging:</strong> Anyone can send messages between supported chains
              </li>
              <li>
                <strong>Sovereign Consensus:</strong> Each chain maintains its own consensus rules
              </li>
              <li>
                <strong>Developer-Friendly:</strong> Simple APIs and SDKs for easy integration
              </li>
            </ul>

            <div className="mt-6 p-4 bg-green-800/30 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> This bridge uses Hyperlane directly and operates independently of other bridge
                protocols. It does not fall back to other bridges if a transaction fails.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
