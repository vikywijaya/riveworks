'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRive } from '@rive-app/react-webgl2'

interface ArtboardPickerProps {
  fileUrl: string
  value: string | null
  onChange: (artboard: string | null) => void
  monoStyle?: React.CSSProperties
}

function RiveLoader({ fileUrl, onArtboards }: { fileUrl: string; onArtboards: (names: string[]) => void }) {
  const { RiveComponent, rive } = useRive({ src: fileUrl, autoplay: false })

  useEffect(() => {
    if (!rive) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const abList: Array<{ name: string }> = (rive as any).contents?.artboards ?? []
    const names = abList.map((ab) => ab.name).filter(Boolean)
    if (names.length > 0) onArtboards(names)
  // onArtboards is stable (useCallback), rive changes once when loaded
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rive])

  return (
    <div style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <RiveComponent />
    </div>
  )
}

export default function ArtboardPicker({ fileUrl, value, onChange, monoStyle }: ArtboardPickerProps) {
  const [artboards, setArtboards] = useState<string[] | null>(null)
  const handleArtboards = useCallback((names: string[]) => setArtboards(names), [])

  return (
    <div style={{ position: 'relative' }}>
      {artboards === null && (
        <RiveLoader fileUrl={fileUrl} onArtboards={handleArtboards} />
      )}
      {artboards !== null && artboards.length > 1 && (
        <div className="flex flex-col gap-1">
          <label className="block text-[10px] text-ink-faint uppercase tracking-[0.15em]" style={monoStyle}>
            thumbnail artboard
          </label>
          <select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            className="w-full px-2 py-1.5 bg-dark-bg border border-dark-border text-ink text-xs focus:outline-none focus:border-ink-faint"
            style={monoStyle}
          >
            <option value="">default</option>
            {artboards.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
