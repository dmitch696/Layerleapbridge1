import type { SVGProps } from "react"

export default function BaseLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="16" cy="16" r="16" fill="#0052FF" />
      <path
        d="M16 6C10.48 6 6 10.48 6 16s4.48 10 10 10 10-4.48 10-10S21.52 6 16 6Zm0 16.25a6.25 6.25 0 1 1 0-12.5 6.25 6.25 0 0 1 0 12.5Z"
        fill="#FFF"
      />
    </svg>
  )
}
