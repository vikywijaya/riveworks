'use client'

import { useState } from 'react'
import RiveCard from '@/components/RiveCard'

interface RiveFile {
  id: string
  title: string
  description: string | null
  fileUrl: string
  thumbnailUrl: string | null
  thumbnailArtboard?: string | null
  bgColor: string | null
}

interface GallerySectionProps {
  files: RiveFile[]
}

const mono = { fontFamily: "'DM Mono', monospace" }

export function GallerySection({ files }: GallerySectionProps) {
  const [cat, setCat] = useState('All')

  const shown = files

  return (
    <>
      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '18px 36px', borderBottom: '1px solid var(--border)', ...mono, fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        <span>Gallery</span>
        <div style={{ display: 'flex', gap: 16 }}>
          {['All'].map(c => {
            const count = c === 'All' ? files.length : 0
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  padding: '4px 0',
                  color: cat === c ? 'var(--ink)' : 'var(--ink-dim)',
                  borderBottom: cat === c ? '1px solid var(--accent)' : '1px solid transparent',
                  ...mono,
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}
              >
                {c} · {count.toString().padStart(2, '0')}
              </button>
            )
          })}
        </div>
        <span style={{ flex: 1, height: 1, background: 'var(--border)', display: 'block' }} />
        <span>Sort · latest</span>
      </div>

      {/* Grid */}
      {shown.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '160px 0', gap: 24, textAlign: 'center' }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Empty</div>
          <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.5rem', color: 'var(--ink-dim)', margin: 0 }}>Nothing here yet</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: 'var(--border)' }}>
          {shown.map((file, i) => (
            <RiveCard
              key={file.id}
              id={file.id}
              title={file.title}
              description={file.description}
              fileUrl={file.fileUrl}
              thumbnailUrl={file.thumbnailUrl}
              bgColor={file.bgColor}
              thumbnailArtboard={file.thumbnailArtboard}
              index={i}
            />
          ))}
        </div>
      )}
    </>
  )
}
