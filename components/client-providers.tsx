"use client"

import type React from "react"

import { WalletProvider } from "@/hooks/use-wallet"

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>
}
