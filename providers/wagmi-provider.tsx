"use client"

import type React from "react"

import { WagmiConfig, createConfig, configureChains } from "wagmi"
import { publicProvider } from "wagmi/providers/public"
import { MetaMaskConnector } from "wagmi/connectors/metaMask"
import { WalletConnectConnector } from "wagmi/connectors/walletConnect"
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet"
import { mainnet, arbitrum, optimism, polygon, base } from "wagmi/chains"

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mainnet, arbitrum, optimism, polygon, base],
  [publicProvider()],
)

const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: "LayerLeap",
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: "layerleap-bridge", // Replace with actual WalletConnect projectId in production
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
})

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return <WagmiConfig config={config}>{children}</WagmiConfig>
}

export { chains }
