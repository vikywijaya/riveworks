'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { RiveFileData } from '@/lib/extractRiveData'
import { DataPanel } from '@/components/DataPanel'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'
import { ShareCard } from '@/components/ShareCard'

const RivePlayerDetail = dynamic(() => import('@/components/RivePlayerDetail'), { ssr: false })

interface RiveFile {
  id: string
  title: string
  description: string | null
  originalName: string
  fileUrl: string
  bgColor: string | null
  allowEmbed: boolean
  allowDownload: boolean
  createdAt: string
}

const mono = { fontFamily: "'DM Mono', monospace" }

function CanvasSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <div style={{ flex: 1, background: 'var(--bg)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ height: 44, flexShrink: 0, borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }} />
    </div>
  )
}

function PanelSkeleton() {
  return (
    <div style={{ width: 380, flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--bg-2)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 44, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 8 }}>
        <div style={{ width: 64, height: 8, background: 'var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: 24, height: 16, background: 'var(--bg-3)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ height: 8, background: 'var(--border)', animation: 'pulse 1.5s ease-in-out infinite', width: `${40 + (i % 3) * 18}%` }} />
            <div style={{ height: 8, width: 48, background: 'var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RiveDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [file, setFile] = useState<RiveFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [fileData, setFileData] = useState<RiveFileData | null>(null)
  const [selectedArtboard, setSelectedArtboard] = useState<string | undefined>()
  const [panelOpen, setPanelOpen] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const riveRef = useRef<any>(null)

  useEffect(() => {
    fetch('/api/rive')
      .then((r) => r.json())
      .then((files: RiveFile[]) => {
        const found = files.find((f) => f.id === id)
        if (found) setFile(found)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRiveReady = useCallback((rive: any) => {
    riveRef.current = rive
  }, [])

  const handleArtboardChange = useCallback((name: string) => {
    setSelectedArtboard(name)
    setFileData(null)
    riveRef.current = null
  }, [])

  if (!file && !loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.4rem', color: 'var(--ink-dim)', margin: 0 }}>Animation not found</p>
        <button
          onClick={() => router.push('/')}
          style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'transparent', border: 0, cursor: 'pointer' }}
        >
          ← back to gallery
        </button>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', background: 'var(--bg)', color: 'var(--ink)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 36px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0, height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <button onClick={() => router.push('/')} style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center' }} title="Back to gallery">
            <Logo height={22} />
          </button>
          <span style={{ border: '1px solid var(--accent-line)', color: 'var(--accent)', padding: '4px 9px', ...mono, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Index · v2
          </span>
          {!loading && file && (
            <>
              <span style={{ color: 'var(--ink-faint)' }}>/</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{file.title}</span>
              {file.description && (
                <>
                  <span style={{ color: 'var(--ink-faint)' }}>·</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'var(--ink-dim)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.description}</span>
                </>
              )}
            </>
          )}
          {loading && <div style={{ width: 140, height: 10, background: 'var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, ...mono, fontSize: 11, color: 'var(--ink-dim)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {!loading && file && <span style={{ color: 'var(--ink-faint)', fontSize: 10 }}>{file.originalName}</span>}
          <ThemeToggle />
          <button
            onClick={() => setPanelOpen((v) => !v)}
            style={{ ...mono, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', border: '1px solid var(--border)', padding: '5px 10px', background: 'transparent', color: 'var(--ink-dim)', cursor: 'pointer' }}
          >
            {panelOpen ? 'hide panel' : 'show panel'}
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', background: (!loading && file?.bgColor) ? file.bgColor : 'var(--bg)' }}>
          {loading ? (
            <CanvasSkeleton />
          ) : (
            <>
              <RivePlayerDetail
                key={selectedArtboard ?? '__default__'}
                fileUrl={file!.fileUrl}
                artboard={selectedArtboard}
                onDataExtracted={setFileData}
                onRiveReady={handleRiveReady}
              />
              {/* Share card overlay */}
              <ShareCard id={id} title={file!.title} originalName={file!.originalName} allowEmbed={file!.allowEmbed} allowDownload={file!.allowDownload} />
            </>
          )}
        </div>

        {/* Data panel */}
        {panelOpen && (
          loading ? (
            <PanelSkeleton />
          ) : (
            <DataPanel
              key={selectedArtboard ?? '__default__'}
              data={fileData}
              riveRef={riveRef}
              selectedArtboard={selectedArtboard}
              onArtboardChange={handleArtboardChange}
            />
          )
        )}
      </div>
    </div>
  )
}
