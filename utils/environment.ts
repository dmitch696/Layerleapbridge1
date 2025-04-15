export const isProduction = process.env.NODE_ENV === "production"
export const isBrowser = typeof window !== "undefined"

// Safe access to window object
export const getWindow = () => {
  if (typeof window === "undefined") return undefined
  return window
}

// Safe access to document object
export const getDocument = () => {
  if (typeof document === "undefined") return undefined
  return document
}
