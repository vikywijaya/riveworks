'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'

const RiveThumbnail = dynamic(() => import('./RiveThumbnail'), { ssr: false })

interface RiveCardProps {
  id: string
  title: string
  description?: string | null
  fileUrl: string
  thumbnailUrl?: string | null
  bgColor?: string | null
  thumbnailArtboard?: string | null
  index?: number
}

const mono = { fontFamily: "'DM Mono', monospace" }
const sans = { fontFamily: "'DM Sans', sans-serif" }

export default function RiveCard({ id, title, description, fileUrl, thumbnailUrl, bgColor, thumbnailArtboard, index = 0 }: RiveCardProps) {
  const [hov, setHov] = useState(false)
  const [copied, setCopied] = useState(false)
  const num = (index + 1).toString().padStart(2, '0')

  function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(`${window.location.origin}/rive/${id}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Link
      href={`/rive/${id}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative',
        display: 'block',
        background: bgColor || 'var(--bg-2)',
        aspectRatio: '1/1',
        overflow: 'hidden',
        textDecoration: 'none',
        color: '#f0ede8',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <RiveThumbnail fileUrl={fileUrl} thumbnailUrl={thumbnailUrl} bgColor={bgColor} artboard={thumbnailArtboard} />
      </div>

      {/* Index — top left */}
      <span style={{ position: 'absolute', top: 10, left: 12, ...mono, fontSize: 10, opacity: 0.7, zIndex: 2 }}>{num}</span>

      {/* Copy link — top right, on hover */}
      <button
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy link'}
        style={{
          position: 'absolute', top: 8, right: 10, zIndex: 3,
          opacity: hov ? 1 : 0,
          transition: 'opacity 0.15s',
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: copied ? 'var(--accent)' : 'rgba(240,237,232,0.7)',
          ...mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
          padding: '4px 8px', cursor: 'pointer',
        }}
      >
        {copied ? '✓ copied' : '⎘ link'}
      </button>

      {/* Bottom info strip */}
      <div style={{
        position: 'absolute', left: 12, right: 12, bottom: 10, zIndex: 2,
        transition: 'transform 0.2s ease',
        transform: hov ? 'translateY(0)' : 'translateY(4px)',
      }}>
        <div style={{ ...sans, fontSize: 13, fontWeight: 500 }}>{title}</div>
        {description && (
          <div style={{ ...mono, fontSize: 9, opacity: 0.6, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
            {description.slice(0, 48)}{description.length > 48 ? '…' : ''}
          </div>
        )}
      </div>

      {/* Accent inset border on hover */}
      {hov && (
        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 2px var(--accent)', zIndex: 4, pointerEvents: 'none' }} />
      )}
    </Link>
  )
}
