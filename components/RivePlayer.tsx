'use client'

import { useMemo } from 'react'
import { useRive } from '@rive-app/react-canvas'

interface RivePlayerProps {
  fileData: string  // base64-encoded .riv file
  className?: string
}

export default function RivePlayer({ fileData, className }: RivePlayerProps) {
  const buffer = useMemo(() => {
    const binary = atob(fileData)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }, [fileData])

  const { RiveComponent } = useRive({
    buffer,
    autoplay: true,
  })

  return <RiveComponent className={className} />
}
