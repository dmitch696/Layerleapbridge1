"use client"

import { useState, createContext, useContext } from "react"
import Notification from "./notification"

// Create context
const NotificationsContext = createContext({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
})

// Provider component
export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const addNotification = (message, type = "info") => {
    const id = Date.now().toString()
    setNotifications((prev) => [...prev, { id, message, type }])
  }

  const removeNotification = (id) => {
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
