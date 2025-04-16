"use client"

import type React from "react"

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  // Simplified provider without dynamic imports
  return <>{children}</>
}

export const chains = [
  { id: 1, name: "Ethereum" },
  { id: 10, name: "Optimism" },
  { id: 42161, name: "Arbitrum" },
  { id: 137, name: "Polygon" },
  { id: 8453, name: "Base" },
]
