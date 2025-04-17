import type { SVGProps } from "react"

export default function ArbitrumLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="16" cy="16" r="16" fill="#2D374B" />
      <path
        d="m16.39 7.11-6.9 11.47a.38.38 0 0 0 .33.57h1.57a.77.77 0 0 0 .65-.37l5.05-8.37 5.05 8.37a.77.77 0 0 0 .65.37h1.57a.38.38 0 0 0 .33-.57L17.8 7.11a.77.77 0 0 0-1.41 0Z"
        fill="#28A0F0"
      />
      <path d="m20.7 19.15-4.3-7.07-4.32 7.07a.38.38 0 0 0 .33.57h7.96a.38.38 0 0 0 .33-.57Z" fill="#FFF" />
      <path
        d="M16.4 23.97a.77.77 0 0 0 .65-.37l1.67-2.77a.38.38 0 0 0-.33-.57h-3.34a.38.38 0 0 0-.33.57l1.67 2.77a.77.77 0 0 0 .65.37h-.64Z"
        fill="#28A0F0"
      />
    </svg>
  )
}
