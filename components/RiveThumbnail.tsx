'use client'

import { useEffect, useRef, useState } from 'react'
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas'

interface RiveThumbnailProps {
  fileUrl: string
  className?: string
}

// Renders Rive off-screen, waits for a frame, then snapshots as PNG
function RiveSnapper({ fileUrl, onSnapshot }: { fileUrl: string; onSnapshot: (url: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const snapped = useRef(false)

  const { RiveComponent, rive } = useRive({
    src: fileUrl,
    autoplay: true,
    layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
  })

  useEffect(() => {
    if (!rive || snapped.current) return

    // Wait enough frames for the first frame to actually render
    let frameCount = 0
    let rafId: number

    const trySnapshot = () => {
      frameCount++
      if (frameCount < 6) {
        rafId = requestAnimationFrame(trySnapshot)
        return
      }

      const canvas = containerRef.current?.querySelector('canvas')
      if (!canvas) {
        rafId = requestAnimationFrame(trySnapshot)
        return
      }

      try {
        const dataUrl = canvas.toDataURL('image/png')
        // A blank canvas returns a very short data URL
        if (dataUrl.length > 5000) {
          snapped.current = true
          onSnapshot(dataUrl)
        } else {
          // Not rendered yet, try again
          if (frameCount < 60) rafId = requestAnimationFrame(trySnapshot)
        }
      } catch {
        // canvas tainted — give up
        snapped.current = true
      }
    }

    rafId = requestAnimationFrame(trySnapshot)
    return () => cancelAnimationFrame(rafId)
  }, [rive, onSnapshot])

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', width: 400, height: 400, top: -9999, left: -9999, pointerEvents: 'none' }}
      aria-hidden
    >
      <RiveComponent style={{ width: 400, height: 400 }} />
    </div>
  )
}

export default function RiveThumbnail({ fileUrl, className }: RiveThumbnailProps) {
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(true)

  const handleSnapshot = (url: string) => {
    setSnapshot(url)
    setCapturing(false)
  }

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      {/* Static snapshot once captured */}
      {snapshot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={snapshot}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover' }}
        />
      )}

      {/* Shimmer while waiting */}
      {!snapshot && (
        <div className="absolute inset-0 bg-dark-bg animate-pulse" />
      )}

      {/* Off-screen snapper — unmounts once done */}
      {capturing && (
        <RiveSnapper fileUrl={fileUrl} onSnapshot={handleSnapshot} />
      )}
    </div>
  )
}
