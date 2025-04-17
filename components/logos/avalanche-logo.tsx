import type { SVGProps } from "react"

export default function AvalancheLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="16" cy="16" r="16" fill="#E84142" />
      <path
        d="M20.72 17.49h3.36l-5.16-9.24c-.6-1.07-2.13-1.07-2.73 0L14.8 11.3h-3.08c-.47 0-.85.38-.85.85 0 .2.07.4.2.55l6.92 9.7c.6 1.07 2.14 1.07 2.74 0l2.86-5.1a.85.85 0 0 0-.77-1.23h-2.1v1.42Zm-9.79 0h-3.36a.85.85 0 0 1-.85-.85c0-.2.07-.4.2-.55l1.78-2.5h3.08c.47 0 .85-.38.85-.85 0-.2-.07-.4-.2-.55l-1.78-2.5a.85.85 0 0 1 .7-1.33h3.36l5.16 9.24c.6 1.07-.15 2.4-1.37 2.4h-6.72a.85.85 0 0 1-.85-.85c0-.2.07-.4.2-.55l1.78-2.5h-2.1l.12.9Z"
        fill="#FFF"
      />
    </svg>
  )
}
