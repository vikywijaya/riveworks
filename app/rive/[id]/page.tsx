'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { RiveFileData } from '@/lib/extractRiveData'
import { DataPanel } from '@/components/DataPanel'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'

const RivePlayerDetail = dynamic(() => import('@/components/RivePlayerDetail'), { ssr: false })

interface RiveFile {
  id: string
  title: string
  description: string | null
  originalName: string
  fileUrl: string
  bgColor: string | null
  createdAt: string
}

function CanvasSkeleton() {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex-1 bg-dark-bg animate-pulse" />
      {/* toolbar stub */}
      <div className="h-11 flex-shrink-0 border-t border-dark-border bg-dark-bg" />
    </div>
  )
}

function PanelSkeleton() {
  return (
    <div className="w-80 flex-shrink-0 border-l border-dark-border bg-dark-card flex flex-col">
      {/* artboard tabs */}
      <div className="h-9 border-b border-dark-border flex items-center px-4 gap-2">
        <div className="h-2 w-16 bg-dark-border animate-pulse" />
        <div className="h-2 w-12 bg-dark-border animate-pulse" />
      </div>
      {/* rows */}
      <div className="flex-1 px-4 py-3 space-y-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-2 bg-dark-border animate-pulse rounded-none" style={{ width: `${40 + (i % 3) * 20}%` }} />
            <div className="h-2 w-12 bg-dark-border animate-pulse" />
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

  const monoStyle = { fontFamily: "'DM Mono', monospace" }

  if (!file && !loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center gap-5">
        <p className="text-ink-dim" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.4rem' }}>
          Animation not found
        </p>
        <button
          onClick={() => router.push('/')}
          className="text-[10px] text-ink-faint hover:text-ink-dim tracking-[0.15em] uppercase transition-colors"
          style={monoStyle}
        >
          ← back to gallery
        </button>
      </div>
    )
  }

  return (
    <div className="h-screen bg-dark-bg text-ink flex flex-col overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-6 h-12 border-b border-dark-border flex-shrink-0">
        <div className="flex items-center gap-5">
          <button
            onClick={() => router.push('/')}
            className="flex items-center"
            title="Back to gallery"
          >
            <Logo height={28} className="text-ink opacity-80 hover:opacity-100 transition-opacity" />
          </button>
          <span className="text-ink-faint" aria-hidden>|</span>
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-3 w-32 bg-dark-border animate-pulse" />
            ) : (
              <>
                <span className="text-sm text-ink leading-none" style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                  {file!.title}
                </span>
                {file!.description && (
                  <>
                    <span className="text-ink-faint" aria-hidden>·</span>
                    <span className="text-xs text-ink-dim truncate max-w-[260px]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {file!.description}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-5">
          {loading ? (
            <div className="h-2.5 w-24 bg-dark-border animate-pulse" />
          ) : (
            <span className="text-[10px] text-ink-faint" style={monoStyle}>{file!.originalName}</span>
          )}
          <ThemeToggle />
          <button
            onClick={() => setPanelOpen((v) => !v)}
            className="text-[10px] text-ink-dim hover:text-ink tracking-[0.15em] uppercase transition-colors border border-dark-border px-2.5 py-1 hover:border-ink-faint"
            style={monoStyle}
          >
            {panelOpen ? 'hide panel' : 'show panel'}
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: (!loading && file?.bgColor) ? file.bgColor : 'var(--bg)' }}>
          {loading ? (
            <CanvasSkeleton />
          ) : (
            <RivePlayerDetail
              key={selectedArtboard ?? '__default__'}
              fileUrl={file!.fileUrl}
              artboard={selectedArtboard}
              onDataExtracted={setFileData}
              onRiveReady={handleRiveReady}
            />
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
