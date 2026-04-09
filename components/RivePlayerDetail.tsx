'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRive as useRiveCanvas } from '@rive-app/react-canvas'
import { useRive as useRiveWebGL2 } from '@rive-app/react-webgl2'
import { extractRiveData } from '@/lib/extractRiveData'
import type { RiveFileData } from '@/lib/extractRiveData'

type RendererType = 'canvas' | 'rive'

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

// ─── RivePreview (mirrors rive-ray RivePreview exactly) ───────────────────────

interface RivePreviewProps {
  buffer: ArrayBuffer
  artboard?: string
  onDataExtracted: (data: RiveFileData) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRiveReady: (rive: any) => void
}

export function RivePreview({ buffer, artboard, onDataExtracted, onRiveReady }: RivePreviewProps) {
  const [renderer, setRenderer] = useState<RendererType>('rive') // default = rive (WebGL2)
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
    onRiveReady(null) // clear stale ref while remounting
  }

  const Player = renderer === 'canvas' ? CanvasRivePlayer : WebGL2RivePlayer
  const playerKey = `${renderer}-${selectedSM ?? 'none'}-${artboard ?? 'default'}`

  return (
    <div className="preview-wrapper">
      <div className="preview-canvas-area">
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

      <div className="renderer-toolbar">
        {availableSMs.length > 0 && (
          <div className="toolbar-group">
            <span className="toolbar-label">State Machine</span>
            <select
              className="sm-select"
              value={selectedSM ?? ''}
              onChange={(e) => setSelectedSM(e.target.value)}
            >
              {availableSMs.map((sm) => (
                <option key={sm} value={sm}>{sm}</option>
              ))}
            </select>
          </div>
        )}
        {availableSMs.length === 0 && <div />}

        <div className="toolbar-group">
          <span className="toolbar-label">Renderer</span>
          <div className="renderer-pill">
            <button
              className={`pill-option ${renderer === 'canvas' ? 'active' : ''}`}
              onClick={() => handleRendererChange('canvas')}
            >
              Canvas
            </button>
            <button
              className={`pill-option ${renderer === 'rive' ? 'active' : ''}`}
              onClick={() => handleRendererChange('rive')}
            >
              Rive
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Loader: fetch URL → ArrayBuffer → RivePreview ────────────────────────────

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
      <div className="preview-wrapper">
        <div className="preview-canvas-area">
          <div className="loading"><div className="spinner" /></div>
        </div>
        <div className="renderer-toolbar"><div /><div /></div>
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
