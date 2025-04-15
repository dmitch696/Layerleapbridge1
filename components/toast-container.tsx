"use client"

import { useToast } from "@/hooks/use-toast"

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-md shadow-lg flex justify-between items-center min-w-[300px] ${
            toast.type === "success"
              ? "bg-green-600"
              : toast.type === "error"
                ? "bg-red-600"
                : toast.type === "warning"
                  ? "bg-yellow-600"
                  : "bg-blue-600"
          }`}
        >
          <div>
            {toast.title && <h4 className="font-medium text-white">{toast.title}</h4>}
            <p className="text-white">{toast.message}</p>
          </div>
          <button onClick={() => removeToast(toast.id)} className="text-white ml-4 hover:opacity-70">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
