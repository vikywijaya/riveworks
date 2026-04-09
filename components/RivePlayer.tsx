'use client'

import { useState } from 'react'
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas'

interface RivePlayerProps {
  fileUrl: string
  className?: string
}

export default function RivePlayer({ fileUrl, className }: RivePlayerProps) {
  const [loaded, setLoaded] = useState(false)

  const { RiveComponent } = useRive({
    src: fileUrl,
    autoplay: true,
    layout: new Layout({ fit: Fit.Cover, alignment: Alignment.TopCenter }),
    onLoad: () => setLoaded(true),
  })

  if (!fileUrl) return null

  return (
    <div className={`absolute inset-0 ${className ?? ''}`}>
      {/* Preloader */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-bg">
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
