'use client'

import Link from 'next/link'
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-webgl2'

const mono = { fontFamily: "'DM Mono', monospace" }
const serif = { fontFamily: "'Instrument Serif', serif" }
const sans = { fontFamily: "'DM Sans', sans-serif" }

interface FeaturedCardProps {
  id: string
  title: string
  description: string | null
  fileUrl: string
  thumbnailUrl: string | null
  bgColor: string | null
}

function LiveRive({ fileUrl, thumbnailUrl, bgColor }: { fileUrl: string; thumbnailUrl: string | null; bgColor: string | null }) {
  const { RiveComponent, rive } = useRive({
    src: fileUrl,
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  })

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Thumbnail shown as bg until Rive is ready */}
      {thumbnailUrl && !rive && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnailUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export function FeaturedCard({ id, title, description, fileUrl, thumbnailUrl, bgColor }: FeaturedCardProps) {
  return (
    <Link
      href={`/rive/${id}`}
      style={{
        position: 'relative',
        display: 'block',
        overflow: 'hidden',
        background: bgColor || '#0d0d0d',
        minHeight: 480,
        color: '#f0ede8',
        textDecoration: 'none',
      }}
    >
      <LiveRive fileUrl={fileUrl} thumbnailUrl={thumbnailUrl} bgColor={bgColor} />

      {/* Featured badge */}
      <span style={{
        position: 'absolute', top: 20, left: 24, zIndex: 2,
        ...mono, fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase',
        background: 'var(--accent)', color: '#0a0a0a', padding: '5px 10px',
        display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <span style={{ width: 6, height: 6, background: '#0a0a0a', borderRadius: '50%', animation: 'blink 1.4s ease-in-out infinite', display: 'inline-block' }} />
        Featured · Live
      </span>

      {/* Gradient scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 55%)', zIndex: 1, pointerEvents: 'none' }} />

      {/* Title / meta */}
      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2 }}>
        <div>
          <div style={{ ...serif, fontStyle: 'italic', fontSize: 44, lineHeight: 1.05, maxWidth: 420 }}>{title}</div>
          {description && <div style={{ ...sans, fontSize: 13, opacity: 0.8, marginTop: 6, maxWidth: 380 }}>{description}</div>}
        </div>
        <div style={{ ...mono, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase' as const, opacity: 0.75, textAlign: 'right' as const }}>
          <div>01</div>
          <div>→ inspect</div>
        </div>
      </div>
    </Link>
  )
}
