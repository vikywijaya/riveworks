'use client'

import { useRive } from '@rive-app/react-canvas'

interface RivePlayerProps {
  src: string
  className?: string
}

export default function RivePlayer({ src, className }: RivePlayerProps) {
  const { RiveComponent } = useRive({
    src,
    autoplay: true,
  })

  return <RiveComponent className={className} />
}
