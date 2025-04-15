"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { ToastContainer } from "@/components/ui/toast-container"
import { ToastProvider as Provider } from "@/components/ui/use-toast"

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <Provider>
      {children}
      <ToastContainer />
    </Provider>
  )
}
