import Header from "@/components/header"
import Footer from "@/components/footer"
import DebugLayerZeroBridge from "@/components/debug-layerzero-bridge"

export default function DebugBridgePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-2">LayerZero Debug Bridge</h1>
          <p className="text-gray-400 mb-8">Debugging tool for LayerZero bridge with detailed logging</p>

          <div className="w-full max-w-md mb-6">
            <DebugLayerZeroBridge />
          </div>

          <div className="max-w-2xl mx-auto mt-8 p-6 bg-gray-800 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Debugging Instructions</h2>
            <p className="mb-4">
              This debug bridge provides detailed logging and simplified parameters to help troubleshoot cross-chain
              messaging issues.
            </p>

            <h3 className="text-lg font-bold mt-6 mb-2">How to Debug</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <strong>Use Minimal Amount:</strong> Start with a very small amount (0.0001 ETH) to minimize risk
              </li>
              <li>
                <strong>Try Simplified Payload:</strong> The simplified payload option uses a basic string instead of
                complex encoding
              </li>
              <li>
                <strong>Adjust Gas Limit:</strong> Try different gas limits if transactions are failing
              </li>
              <li>
                <strong>Check Debug Logs:</strong> Expand the debug logs section to see detailed information about each
                step
              </li>
              <li>
                <strong>Verify on LayerZero Scan:</strong> After submitting a transaction, check it on LayerZero Scan to
                track cross-chain delivery
              </li>
            </ol>

            <h3 className="text-lg font-bold mt-6 mb-2">Console Debugging</h3>
            <p className="mb-2">You can also run direct tests from your browser console using the following command:</p>
            <div className="bg-gray-900 p-3 rounded font-mono text-sm">window.testLayerZeroBridge()</div>
            <p className="text-xs text-gray-400 mt-2">
              Open your browser console (F12) and run this command to execute a direct test without the UI
            </p>

            <div className="mt-6 p-4 bg-yellow-800/30 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> This is a debugging tool and should only be used with small test amounts. Always
                verify transactions on block explorers and LayerZero Scan.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
