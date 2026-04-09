'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { RiveFileData } from '@/lib/extractRiveData'
import { DataPanel } from '@/components/DataPanel'

const RivePlayerDetail = dynamic(() => import('@/components/RivePlayerDetail'), { ssr: false })

interface RiveFile {
  id: string
  title: string
  description: string | null
  originalName: string
  fileUrl: string
  createdAt: string
}

export default function RiveDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [file, setFile] = useState<RiveFile | null>(null)
  const [loading, setLoading] = useState(true)
  const [fileData, setFileData] = useState<RiveFileData | null>(null)
  const [selectedArtboard, setSelectedArtboard] = useState<string | undefined>()
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!file) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'var(--text-muted)' }}>Animation not found.</p>
        <button onClick={() => router.push('/')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
          ← Back to gallery
        </button>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Header — mirrors rive-ray inspector-header */}
      <header className="header inspector-header">
        <div className="header-left">
          <button
            onClick={() => router.push('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 0 }}
            title="Back to gallery"
          >
            <svg width="70" height="50" viewBox="0 0 70 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="4" y="38" fontFamily="'SF Mono','Fira Code',monospace" fontSize="36" fontWeight="700" fill="#6c5ce7">RW</text>
            </svg>
          </button>
          <span className="header-title">{file.title}</span>
          {file.description && (
            <>
              <div className="header-divider" />
              <span className="header-subtitle">{file.description}</span>
            </>
          )}
        </div>
        <div className="header-right">
          <div className="file-chip">{file.originalName}</div>
          <button className="remove-btn" onClick={() => router.push('/')}>← Gallery</button>
        </div>
      </header>

      {/* Main layout — exact mirror of rive-ray .main */}
      <div className="main">
        <div className="preview-panel" style={{ position: 'relative' }}>
          <RivePlayerDetail
            key={selectedArtboard ?? '__default__'}
            fileUrl={file.fileUrl}
            artboard={selectedArtboard}
            onDataExtracted={setFileData}
            onRiveReady={handleRiveReady}
          />
          {/* Title overlay — sits above toolbar, bottom of canvas */}
          <div className="preview-title-overlay">
            <div className="preview-title-inner">
              <h1 className="preview-title-text">{file.title}</h1>
              {file.description && (
                <p className="preview-title-desc">{file.description}</p>
              )}
            </div>
          </div>
        </div>

        <DataPanel
          key={selectedArtboard ?? '__default__'}
          data={fileData}
          riveRef={riveRef}
          selectedArtboard={selectedArtboard}
          onArtboardChange={handleArtboardChange}
        />
      </div>
    </div>
  )
}
