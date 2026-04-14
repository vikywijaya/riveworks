'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas'

interface Props {
  fileUrl: string
}

export default function RiveThumbnail({ fileUrl }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const snapped = useRef(false)

  const { RiveComponent, rive } = useRive({
    src: fileUrl,
    autoplay: true,
    layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
  })

  const tryCapture = useCallback(() => {
    if (snapped.current) return
    const riveCanvas = containerRef.current?.querySelector('canvas')
    if (!riveCanvas || riveCanvas.width === 0) return

    // Copy to a 2D canvas to read pixels
    const copy = document.createElement('canvas')
    copy.width = riveCanvas.width
    copy.height = riveCanvas.height
    const ctx = copy.getContext('2d')
    if (!ctx) return

    try {
      ctx.drawImage(riveCanvas, 0, 0)
      const data = ctx.getImageData(0, 0, 8, 8).data
      // Check if at least one pixel is non-transparent
      const hasPixels = data.some((v, i) => i % 4 === 3 && v > 0)
      if (!hasPixels) return

      const dataUrl = copy.toDataURL('image/png')
      snapped.current = true
      setSnapshot(dataUrl)
    } catch {
      // cross-origin taint — just leave the live canvas visible
      snapped.current = true
    }
  }, [])

  useEffect(() => {
    if (!rive) return

    let attempts = 0
    let rafId: number

    const loop = () => {
      attempts++
      tryCapture()
      if (!snapped.current && attempts < 120) {
        rafId = requestAnimationFrame(loop)
      }
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [rive, tryCapture])

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Live canvas — visible until snapshot is ready, then hidden */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: snapshot ? 0 : 1, pointerEvents: 'none' }}
      >
        <RiveComponent className="w-full h-full" />
      </div>

      {/* Static snapshot */}
      {snapshot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={snapshot}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover' }}
        />
      )}

      {/* Shimmer before first render */}
      {!snapshot && !rive && (
        <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
      )}
    </div>
  )
}
