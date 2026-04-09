'use client'

import { useEffect } from 'react'
import { useRive } from '@rive-app/react-canvas'

interface RivePlayerProps {
  fileUrl: string
  className?: string
  playing?: boolean
}

export default function RivePlayer({ fileUrl, className, playing = false }: RivePlayerProps) {
  const { RiveComponent, rive } = useRive({
    src: fileUrl,
    autoplay: true,
  })

  useEffect(() => {
    if (!rive) return
    // On first load: pause immediately to show first frame as thumbnail
    if (playing) {
      rive.play()
    } else {
      rive.pause()
    }
  }, [rive, playing])

  if (!fileUrl) return null

  return <RiveComponent className={className} />
}
