'use client'

import { useRive, Layout, Fit, Alignment } from '@rive-app/react-webgl2'

interface Props {
  fileUrl: string
  thumbnailUrl?: string | null
  bgColor?: string | null
  artboard?: string | null
}

export default function RiveThumbnail({ fileUrl, thumbnailUrl, bgColor, artboard }: Props) {
  const { RiveComponent, rive } = useRive({
    src: fileUrl,
    artboard: artboard ?? undefined,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  })

  const bg = bgColor || 'transparent'

  return (
    <div className="absolute inset-0 w-full h-full" style={{ background: bg }}>
      {/* Thumbnail shown as bg placeholder until Rive canvas is ready */}
      {thumbnailUrl && !rive && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover' }}
        />
      )}
      <RiveComponent className="w-full h-full" />
    </div>
  )
}
