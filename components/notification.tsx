"use client"

import { useState, useEffect } from "react"

interface NotificationProps {
  message: string
  type?: "info" | "success" | "error" | "warning"
  duration?: number
  onClose?: () => void
}

export default function Notification({ message, type = "info", duration = 5000, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => {
        if (onClose) onClose()
      }, 300) // Allow time for exit animation
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor =
    type === "success"
      ? "bg-green-600"
      : type === "error"
        ? "bg-red-600"
        : type === "warning"
          ? "bg-yellow-600"
          : "bg-blue-600"

  return (
    <div
      className={`p-4 rounded-md shadow-lg flex justify-between items-center min-w-[300px] transition-all duration-300 ${bgColor} ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <p className="text-white">{message}</p>
      <button onClick={() => setIsVisible(false)} className="text-white ml-4 hover:opacity-70">
        ✕
      </button>
    </div>
  )
}
