"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@/hooks/use-wallet"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function WalletConnectComponent() {
  const { address, isConnected, connect, disconnect, isMetaMaskAvailable } = useWallet()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Button variant="outline">Connect Wallet</Button>
  }

  const handleConnect = async () => {
    await connect()
    setIsOpen(false)
  }

  return (
    <>
      {isConnected ? (
        <div className="flex items-center gap-2">
          <span className="text-sm hidden md:inline-block">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <Button variant="outline" size="sm" onClick={disconnect}>
            Disconnect
          </Button>
        </div>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Connect Wallet</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>Choose a wallet provider to connect to LayerLeap.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button onClick={handleConnect} disabled={!isMetaMaskAvailable}>
                {isMetaMaskAvailable ? "MetaMask" : "MetaMask (Not Installed)"}
              </Button>
              <Button disabled>Coinbase Wallet (Coming Soon)</Button>
              <Button disabled>WalletConnect (Coming Soon)</Button>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
