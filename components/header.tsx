import Link from "next/link"
import WalletButton from "./wallet-button"
import LayerLeapLogo from "./logos/layerleap-logo"

export default function Header() {
  return (
    <header className="border-b border-gray-800 bg-black">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <LayerLeapLogo />
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-sm font-medium hover:text-blue-400">
            Home
          </Link>
          <Link href="/bridge" className="text-sm font-medium hover:text-blue-400">
            Bridge
          </Link>
          <Link href="#" className="text-sm font-medium hover:text-blue-400">
            Docs
          </Link>
        </nav>

        <WalletButton />
      </div>
    </header>
  )
}
