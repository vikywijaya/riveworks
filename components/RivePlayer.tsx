'use client'

import { useState, useEffect } from 'react'
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-webgl2'

interface RivePlayerProps {
  fileUrl: string
  className?: string
  playing?: boolean
}

export default function RivePlayer({ fileUrl, className, playing = false }: RivePlayerProps) {
  const [loaded, setLoaded] = useState(false)

  const { RiveComponent, rive } = useRive({
    src: fileUrl,
    autoplay: true,
    layout: new Layout({ fit: Fit.Cover, alignment: Alignment.TopCenter }),
    onLoad: () => setLoaded(true),
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

  return (
    <div className={`absolute inset-0 ${className ?? ''}`}>
      {/* Preloader */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
          <div className="spinner" />
        </div>
      )}
      <RiveComponent
        className="w-full h-full"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
      />
    </div>
  )
}
