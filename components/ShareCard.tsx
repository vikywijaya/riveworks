'use client'

import { useState } from 'react'

interface ShareCardProps {
  id: string
  title: string
  originalName: string
  allowEmbed: boolean
  allowDownload: boolean
}

const mono = { fontFamily: "'DM Mono', monospace" }

export function ShareCard({ id, title, originalName, allowEmbed, allowDownload }: ShareCardProps) {
  const [visible, setVisible] = useState(true)
  const [mode, setMode] = useState<'Link' | 'Embed' | '.riv'>('Link')
  const tabs = (['Link', ...(allowEmbed ? ['Embed'] : []), ...(allowDownload ? ['.riv'] : [])] as ('Link' | 'Embed' | '.riv')[])
  const [copied, setCopied] = useState(false)

  const url = typeof window !== 'undefined' ? `${window.location.origin}/rive/${id}` : `/rive/${id}`
  const embed = `<iframe src="${url}"\n  width="560" height="420"\n  loading="lazy"></iframe>`

  function copy() {
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        style={{
          position: 'absolute', right: 24, top: 20, zIndex: 10,
          background: 'var(--accent)', color: '#0a0a0a', border: 0,
          padding: '7px 12px', cursor: 'pointer',
          ...mono, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase',
        }}
      >
        ⎘ Share
      </button>
    )
  }

  return (
    <div style={{
      position: 'absolute', right: 24, top: 20, zIndex: 10,
      minWidth: 300, maxWidth: 340,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
      color: '#f0ede8',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...mono, fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', opacity: 0.7 }}>
        <span>Share · {title}</span>
        <button onClick={() => setVisible(false)} style={{ background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer', fontSize: 14, opacity: 0.6, lineHeight: 1 }}>×</button>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        {tabs.map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              ...mono, fontSize: 9, padding: '5px 9px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: mode === m ? 'var(--accent)' : 'transparent',
              color: mode === m ? '#0a0a0a' : 'rgba(240,237,232,0.8)',
              letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Content */}
      {mode === 'Link' && (
        <button
          onClick={copy}
          style={{
            ...mono, fontSize: 11, color: '#fff',
            background: 'rgba(255,255,255,0.06)',
            padding: '9px 11px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            border: 0, cursor: 'pointer', textAlign: 'left',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
          <span style={{ color: 'var(--accent)', fontSize: 9, letterSpacing: '0.2em', flexShrink: 0, marginLeft: 8 }}>
            {copied ? '✓ COPIED' : '↗ COPY'}
          </span>
        </button>
      )}
      {mode === 'Embed' && (
        <pre style={{ margin: 0, ...mono, fontSize: 10, background: 'rgba(0,0,0,0.4)', padding: 10, lineHeight: 1.65, whiteSpace: 'pre-wrap', color: 'rgba(240,237,232,0.85)' }}>
          {embed}
        </pre>
      )}
      {mode === '.riv' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.06)', padding: '10px 12px', ...mono, fontSize: 11 }}>
          <span>{originalName}</span>
          <a
            href={`/api/rive/${id}/download`}
            style={{ color: 'var(--accent)', fontSize: 9, letterSpacing: '0.2em', textDecoration: 'none', textTransform: 'uppercase' }}
          >
            ↓ DOWNLOAD
          </a>
        </div>
      )}
    </div>
  )
}
