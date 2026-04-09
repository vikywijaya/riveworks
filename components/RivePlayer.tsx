'use client'

import { useRive } from '@rive-app/react-canvas'

interface RivePlayerProps {
  fileUrl: string
  className?: string
}

export default function RivePlayer({ fileUrl, className }: RivePlayerProps) {
  const { RiveComponent } = useRive({
    src: fileUrl,
    autoplay: true,
  })

  if (!fileUrl) return null

  return <RiveComponent className={className} />
}
