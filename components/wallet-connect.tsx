"use client"
import { useWallet } from "@/hooks/use-wallet"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

// Create the component
function WalletConnectComponent() {
  const { address, isConnected, connect, disconnect } = useWallet()

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
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Connect Wallet</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>Choose a wallet provider to connect to LayerLeap.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Button onClick={() => connect("metamask")}>MetaMask</Button>
              <Button onClick={() => connect("coinbase")}>Coinbase Wallet</Button>
              <Button onClick={() => connect("walletconnect")}>WalletConnect</Button>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// Export as both default and named export
export default WalletConnectComponent
export { WalletConnectComponent as WalletConnect }
