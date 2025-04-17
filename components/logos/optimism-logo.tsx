import type { SVGProps } from "react"

export default function OptimismLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="16" cy="16" r="16" fill="#FF0420" />
      <path
        d="M10.88 8.94a3.58 3.58 0 0 1 3.58 3.58v6.96a3.58 3.58 0 0 1-7.16 0v-6.96a3.58 3.58 0 0 1 3.58-3.58Zm10.24 0a3.58 3.58 0 0 1 3.58 3.58v6.96a3.58 3.58 0 1 1-7.16 0v-6.96a3.58 3.58 0 0 1 3.58-3.58Z"
        fill="#FFF"
      />
    </svg>
  )
}
