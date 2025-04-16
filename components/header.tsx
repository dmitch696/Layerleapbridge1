import Link from "next/link"
import WalletButtonWrapper from "./wallet-button-wrapper"

export default function Header() {
  return (
    <header className="border-b border-gray-800">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            LayerLeap
          </span>
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

        <WalletButtonWrapper />
      </div>
    </header>
  )
}
