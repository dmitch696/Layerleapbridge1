"use client"

import { useWallet } from "@/hooks/use-wallet"

export default function WalletButton() {
  const { address, isConnected, connect, disconnect, isMetaMaskAvailable } = useWallet()

  if (!isMetaMaskAvailable) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
      >
        Install MetaMask
      </a>
    )
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm hidden md:inline-block">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button onClick={connect} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
      Connect Wallet
    </button>
  )
}
