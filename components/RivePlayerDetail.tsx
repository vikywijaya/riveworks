'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRive as useRiveCanvas } from '@rive-app/react-canvas'
import { useRive as useRiveWebGL2 } from '@rive-app/react-webgl2'
import { extractRiveData } from '@/lib/extractRiveData'
import type { RiveFileData } from '@/lib/extractRiveData'

type RendererType = 'canvas' | 'rive'

const mono = { fontFamily: "'DM Mono', monospace" }

// ─── CanvasRivePlayer ─────────────────────────────────────────────────────────

interface RivePlayerProps {
  buffer: ArrayBuffer
  artboard?: string
  stateMachine?: string
  onDataExtracted: (data: RiveFileData) => void
  onSMsDiscovered: (sms: string[]) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRiveReady: (rive: any) => void
}

function CanvasRivePlayer({ buffer, artboard, stateMachine, onDataExtracted, onSMsDiscovered, onRiveReady }: RivePlayerProps) {
  const extractedRef = useRef(false)
  const { rive, RiveComponent } = useRiveCanvas({
    buffer: buffer.slice(0),
    artboard,
    stateMachines: stateMachine,
    autoplay: true,
    autoBind: true,
  })
  useEffect(() => {
    if (!rive || extractedRef.current) return
    onSMsDiscovered((rive.stateMachineNames as string[]) ?? [])
    onRiveReady(rive)
    const timer = setTimeout(() => {
      extractedRef.current = true
      onDataExtracted(extractRiveData(rive))
    }, 300)
    return () => clearTimeout(timer)
  }, [rive, onDataExtracted, onSMsDiscovered, onRiveReady])
  return <RiveComponent style={{ width: '100%', height: '100%' }} />
}

// ─── WebGL2RivePlayer ─────────────────────────────────────────────────────────

function WebGL2RivePlayer({ buffer, artboard, stateMachine, onDataExtracted, onSMsDiscovered, onRiveReady }: RivePlayerProps) {
  const extractedRef = useRef(false)
  const { rive, RiveComponent } = useRiveWebGL2({
    buffer: buffer.slice(0),
    artboard,
    stateMachines: stateMachine,
    autoplay: true,
    autoBind: true,
  })
  useEffect(() => {
    if (!rive || extractedRef.current) return
    onSMsDiscovered((rive.stateMachineNames as string[]) ?? [])
    onRiveReady(rive)
    const timer = setTimeout(() => {
      extractedRef.current = true
      onDataExtracted(extractRiveData(rive))
    }, 300)
    return () => clearTimeout(timer)
  }, [rive, onDataExtracted, onSMsDiscovered, onRiveReady])
  return <RiveComponent style={{ width: '100%', height: '100%' }} />
}

// ─── RivePreview ──────────────────────────────────────────────────────────────

interface RivePreviewProps {
  buffer: ArrayBuffer
  artboard?: string
  onDataExtracted: (data: RiveFileData) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRiveReady: (rive: any) => void
}

export function RivePreview({ buffer, artboard, onDataExtracted, onRiveReady }: RivePreviewProps) {
  const [renderer, setRenderer] = useState<RendererType>('rive')
  const [availableSMs, setAvailableSMs] = useState<string[]>([])
  const [selectedSM, setSelectedSM] = useState<string | undefined>(undefined)

  const handleSMsDiscovered = useCallback((sms: string[]) => {
    setAvailableSMs((prev) => {
      if (prev.length > 0) return prev
      if (sms.length > 0) setSelectedSM((cur) => cur ?? sms[0])
      return sms
    })
  }, [])

  const handleRendererChange = (r: RendererType) => {
    setRenderer(r)
    onRiveReady(null)
  }

  const Player = renderer === 'canvas' ? CanvasRivePlayer : WebGL2RivePlayer
  const playerKey = `${renderer}-${selectedSM ?? 'none'}-${artboard ?? 'default'}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Canvas area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Player
          key={playerKey}
          buffer={buffer}
          artboard={artboard}
          stateMachine={selectedSM}
          onDataExtracted={onDataExtracted}
          onSMsDiscovered={handleSMsDiscovered}
          onRiveReady={onRiveReady}
        />
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: '44px',
          background: 'var(--bg)',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        {/* State machine selector */}
        {availableSMs.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>SM</span>
            <select
              value={selectedSM ?? ''}
              onChange={(e) => setSelectedSM(e.target.value)}
              style={{
                ...mono,
                fontSize: 11,
                color: 'var(--ink-dim)',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                padding: '3px 8px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {availableSMs.map((sm) => (
                <option key={sm} value={sm} style={{ background: 'var(--bg-card)' }}>{sm}</option>
              ))}
            </select>
          </div>
        ) : (
          <div />
        )}

        {/* Renderer toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Renderer</span>
          <div style={{ display: 'flex', border: '1px solid var(--border)' }}>
            {(['canvas', 'rive'] as RendererType[]).map((r, i) => (
              <button
                key={r}
                onClick={() => handleRendererChange(r)}
                style={{
                  ...mono,
                  fontSize: 10,
                  padding: '3px 12px',
                  background: renderer === r ? 'var(--ink)' : 'transparent',
                  color: renderer === r ? 'var(--bg)' : 'var(--ink-dim)',
                  border: 'none',
                  borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  transition: 'all 0.15s',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Loader ───────────────────────────────────────────────────────────────────

interface RivePlayerDetailProps {
  fileUrl: string
  artboard?: string
  onDataExtracted: (data: RiveFileData) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRiveReady: (rive: any) => void
}

export default function RivePlayerDetail({ fileUrl, artboard, onDataExtracted, onRiveReady }: RivePlayerDetailProps) {
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null)

  useEffect(() => {
    fetch(fileUrl)
      .then((r) => r.arrayBuffer())
      .then((buf) => setBuffer(buf))
      .catch(console.error)
  }, [fileUrl])

  if (!buffer) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        {/* canvas skeleton */}
        <div style={{ flex: 1, background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, var(--border) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'rive-shimmer 1.4s ease-in-out infinite',
          }} />
        </div>
        {/* toolbar skeleton */}
        <div style={{
          height: 44,
          flexShrink: 0,
          borderTop: '1px solid var(--border)',
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}>
          <div style={{ width: 80, height: 8, background: 'var(--border)', borderRadius: 0 }} />
          <div style={{ width: 100, height: 8, background: 'var(--border)', borderRadius: 0 }} />
        </div>
      </div>
    )
  }

  return (
    <RivePreview
      buffer={buffer}
      artboard={artboard}
      onDataExtracted={onDataExtracted}
      onRiveReady={onRiveReady}
    />
  )
}
