import Image from "next/image"

interface LayerLeapLogoProps {
  className?: string
  showText?: boolean
}

export default function LayerLeapLogo({ className = "h-10 w-auto", showText = true }: LayerLeapLogoProps) {
  return (
    <div className="flex items-center">
      <Image src="/images/logo.png" alt="LayerLeap Logo" width={40} height={40} className={className} />
      {showText && <span className="ml-2 text-xl font-bold text-white">LayerLeap</span>}
    </div>
  )
}
