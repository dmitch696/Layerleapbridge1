import Header from "@/components/header"
import Footer from "@/components/footer"
import ChainSupportDebug from "@/components/chain-support-debug"

export default function DebugPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-2">Bridge Debug</h1>
          <p className="text-gray-400 mb-8">Diagnose issues with the LayerZero bridge</p>

          <div className="w-full max-w-md mb-6">
            <ChainSupportDebug />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
