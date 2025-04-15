import dynamic from 'next/dynamic'
import ProtocolInfo from "@/components/protocol-info"
import Header from "@/components/header"
import Footer from "@/components/footer"

// Dynamically import the HyperlaneBridge component with no SSR
const HyperlaneBridge = dynamic(
  () => import('@/components/hyperlane-bridge'),
  { ssr: false }
)

export default function BridgePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold mb-8">Bridge Your Assets</h1>

          <div className="w-full max-w-md mb-12">
            <HyperlaneBridge />
          </div>

          <ProtocolInfo />
        </div>
      </main>

      <Footer />
    </div>
  )
}
