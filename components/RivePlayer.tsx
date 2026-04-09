'use client'

import { useEffect } from 'react'
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-webgl2'

interface RivePlayerProps {
  fileUrl: string
  className?: string
  playing?: boolean
}

export default function RivePlayer({ fileUrl, className, playing = false }: RivePlayerProps) {
  const { RiveComponent, rive } = useRive({
    src: fileUrl,
    autoplay: true,
    layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
  })

  useEffect(() => {
    if (!rive) return
    if (playing) {
      rive.play()
    } else {
      rive.pause()
    }
  }, [rive, playing])

  if (!fileUrl) return null

  return <RiveComponent className={className} />
}
