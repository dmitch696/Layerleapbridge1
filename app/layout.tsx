import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ToastProvider } from "@/components/ui/toast-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "LayerLeap - Cross-Chain Bridge",
  description: "Bridge your assets across chains with Hyperlane and LayerZero",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}


import './globals.css'