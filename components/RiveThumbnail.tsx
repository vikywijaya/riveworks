'use client'

import { useEffect, useRef, useState } from 'react'
import { Rive, Layout, Fit, Alignment } from '@rive-app/react-canvas'

interface RiveThumbnailProps {
  fileUrl: string
  className?: string
}

export default function RiveThumbnail({ fileUrl, className }: RiveThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [snapshot, setSnapshot] = useState<string | null>(null)

  useEffect(() => {
    if (!fileUrl) return

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512

    let r: Rive | null = null

    r = new Rive({
      src: fileUrl,
      canvas,
      autoplay: true,
      layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
      onLoad: () => {
        // Give it a couple of frames to render
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              const dataUrl = canvas.toDataURL('image/png')
              setSnapshot(dataUrl)
            } catch {
              // cross-origin canvas taint — leave snapshot null
            }
            r?.cleanup()
            r = null
          })
        })
      },
    })

    return () => {
      r?.cleanup()
    }
  }, [fileUrl])

  if (snapshot) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={snapshot}
        alt=""
        className={className}
        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
      />
    )
  }

  // While loading: show a subtle shimmer
  return (
    <div className={`${className ?? ''} w-full h-full bg-dark-bg animate-pulse`} />
  )
}
