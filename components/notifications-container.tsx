"use client"

import { useState, createContext, useContext, type ReactNode } from "react"
import Notification from "./notification"

type NotificationType = "info" | "success" | "error" | "warning"

interface NotificationInterface {
  id: string
  message: string
  type: NotificationType
}

interface NotificationsContextType {
  notifications: NotificationInterface[]
  addNotification: (message: string, type?: NotificationType) => void
  removeNotification: (id: string) => void
}

// Create context
const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
})

// Provider component
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationInterface[]>([])

  const addNotification = (message: string, type: NotificationType = "info") => {
    const id = Date.now().toString()
    setNotifications((prev) => [...prev, { id, message, type }])
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  return (
    <NotificationsContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationsContext.Provider>
  )
}

// Hook to use notifications
export function useNotifications() {
  return useContext(NotificationsContext)
}
