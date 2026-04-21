'use client'

import { useState, useCallback, useRef, type RefObject } from 'react'
import type { RiveFileData, DataBindingVar } from '@/lib/extractRiveData'
import { hexToRgb } from '@/lib/extractRiveData'

interface DataPanelProps {
  data: RiveFileData | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  riveRef: RefObject<any>
  selectedArtboard?: string
  onArtboardChange: (name: string) => void
}

const mono = { fontFamily: "'DM Mono', monospace" }

// Type tag colors — muted, not garish
const typeColors: Record<string, { fg: string; bg: string }> = {
  boolean: { fg: '#68d391', bg: 'rgba(104,211,145,0.08)' },
  trigger:  { fg: '#f6ad55', bg: 'rgba(246,173,85,0.08)' },
  string:   { fg: '#76e4f7', bg: 'rgba(118,228,247,0.08)' },
  color:    { fg: '#f687b3', bg: 'rgba(246,135,179,0.08)' },
  enum:     { fg: '#b794f4', bg: 'rgba(183,148,244,0.08)' },
  number:   { fg: '#63b3ed', bg: 'rgba(99,179,237,0.08)' },
}

export function DataPanel({ data, riveRef, selectedArtboard, onArtboardChange }: DataPanelProps) {
  const [overrides, setOverrides] = useState<Record<string, DataBindingVar['value']>>({})

  const setVar = useCallback(
    (variable: DataBindingVar, newValue: DataBindingVar['value']) => {
      const rive = riveRef.current
      if (!rive) return

      try {
        if (variable.source === 'statemachine') {
          const inputs = rive.stateMachineInputs(variable.stateMachineName) ?? []
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const input = inputs.find((i: any) => i.name === variable.name)
          if (!input) return
          if (variable.type === 'boolean') input.value = Boolean(newValue)
          if (variable.type === 'number') input.value = Number(newValue)
          if (variable.type === 'trigger') input.fire()
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let vmi: any = null
          if (variable.isBoundInstance) {
            vmi = rive.viewModelInstance
          } else if (variable.viewModelName !== undefined && variable.instanceIndex !== undefined) {
            try {
              const vmCount = rive.viewModelCount ?? 0
              for (let i = 0; i < vmCount; i++) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const vm: any = rive.viewModelByIndex(i)
                if (vm?.name === variable.viewModelName) {
                  vmi = vm.instanceByIndex(variable.instanceIndex)
                  break
                }
              }
            } catch { /* none */ }
          }
          if (!vmi) return
          for (const propName of variable.nestedPropPath ?? []) {
            try { vmi = vmi.viewModel?.(propName) } catch { vmi = null }
            if (!vmi) return
          }
          if (variable.type === 'boolean') vmi.boolean(variable.name).value = Boolean(newValue)
          if (variable.type === 'number') vmi.number(variable.name).value = Number(newValue)
          if (variable.type === 'trigger') vmi.trigger(variable.name).trigger()
          if (variable.type === 'enum') vmi.enum(variable.name).value = String(newValue)
          if (variable.type === 'color') {
            const { r, g, b } = hexToRgb(String(newValue))
            vmi.color(variable.name).rgb(r, g, b)
          }
          if (variable.type === 'string') vmi.string(variable.name).value = String(newValue)
        }
      } catch { /* input may not be active */ }

      if (variable.type !== 'trigger') {
        const key = `${variable.instanceName ?? variable.viewModelName ?? ''}::${variable.name}`
        setOverrides((prev) => ({ ...prev, [key]: newValue }))
      }
    },
    [riveRef]
  )

  const panelStyle: React.CSSProperties = {
    width: 380,
    minWidth: 380,
    height: '100%',
    background: 'var(--bg-2)',
    borderLeft: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  if (!data) {
    return (
      <div style={panelStyle}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>Data</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...mono, fontSize: 10, color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>Loading…</span>
        </div>
      </div>
    )
  }

  const total = data.variables.length

  const groupKeys: string[] = []
  const groups = new Map<string, DataBindingVar[]>()
  for (const v of data.variables) {
    let key: string
    if (v.source === 'viewmodel') {
      const base = v.instanceName ?? v.viewModelName ?? 'ViewModel'
      key = v.nestedPropPath?.length ? `${v.nestedPropPath.join('.')} (${base})` : base
    } else {
      key = v.stateMachineName ?? 'State Machine'
    }
    if (!groups.has(key)) { groups.set(key, []); groupKeys.push(key) }
    groups.get(key)!.push(v)
  }

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>Data</span>
        {total > 0 && (
          <span style={{ ...mono, fontSize: 10, color: 'var(--ink-dim)', background: 'var(--bg-3)', padding: '2px 7px' }}>{total}</span>
        )}
      </div>

      {/* Artboard tabs */}
      {data.artboards.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '10px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {data.artboards.map((ab) => {
            const active = (selectedArtboard ?? data.artboards[0]?.name) === ab.name
            return (
              <button
                key={ab.name}
                onClick={() => onArtboardChange(ab.name)}
                style={{
                  ...mono,
                  fontSize: 10,
                  padding: '3px 10px',
                  background: active ? 'var(--ink)' : 'transparent',
                  color: active ? 'var(--bg)' : 'var(--ink-dim)',
                  border: '1px solid',
                  borderColor: active ? 'var(--ink)' : 'var(--border)',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  transition: 'all 0.15s',
                }}
              >
                {ab.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {total === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ ...mono, fontSize: 11, color: 'var(--ink-faint)', lineHeight: 1.7 }}>
              No data binding variables found.
            </p>
            <p style={{ ...mono, fontSize: 10, color: 'var(--border)', marginTop: 6, lineHeight: 1.7 }}>
              Expected: boolean, number, trigger,<br />enum, color, or string
            </p>
          </div>
        )}

        {groupKeys.map((key) => {
          const items = groups.get(key)!
          const firstVar = items[0]
          const isTopLevelBound = firstVar?.isBoundInstance === true && !firstVar?.nestedPropPath
          const isVM = firstVar?.source === 'viewmodel'
          const badge = isTopLevelBound ? 'main' : isVM ? 'vm' : 'sm'
          return (
            <CollapsibleSection key={key} title={key} count={items.length} badge={badge}>
              {items.map((v, i) => {
                const overrideKey = `${v.instanceName ?? v.viewModelName ?? ''}::${v.name}`
                return (
                  <VarRow
                    key={`${v.instanceName}-${v.name}-${i}`}
                    variable={v}
                    overrideValue={overrides[overrideKey]}
                    onChange={(val) => setVar(v, val)}
                  />
                )
              })}
            </CollapsibleSection>
          )
        })}
      </div>
    </div>
  )
}

// ─── VarRow ───────────────────────────────────────────────────────────────────

interface VarRowProps {
  variable: DataBindingVar
  overrideValue?: DataBindingVar['value']
  onChange: (val: DataBindingVar['value']) => void
}

function VarRow({ variable: v, overrideValue, onChange }: VarRowProps) {
  const currentValue = overrideValue !== undefined ? overrideValue : v.value
  const col = typeColors[v.type] ?? { fg: '#888580', bg: 'transparent' }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '9px 12px',
      gap: 8,
      background: 'var(--bg)',
      border: '1px solid var(--border-dim)',
      minHeight: 38,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
        {/* Type tag */}
        <span style={{
          ...mono,
          fontSize: 9,
          padding: '2px 6px',
          background: col.bg,
          color: col.fg,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          {v.type}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <span style={{ ...mono, fontSize: 11, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {v.name}
          </span>
          {(v.source === 'viewmodel' ? v.viewModelName : v.stateMachineName) && (
            <span style={{ ...mono, fontSize: 9, color: 'var(--ink-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {v.source === 'viewmodel' ? v.viewModelName : v.stateMachineName}
            </span>
          )}
        </div>
      </div>

      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        {v.type === 'boolean' && <BooleanToggle value={Boolean(currentValue)} onChange={onChange} />}
        {v.type === 'trigger' && <TriggerButton onClick={() => onChange(undefined)} />}
        {v.type === 'enum' && <EnumSelect value={String(currentValue ?? '')} options={v.enumValues ?? []} onChange={onChange} />}
        {v.type === 'color' && <ColorPicker value={typeof currentValue === 'string' ? currentValue : '#000000'} onChange={onChange} />}
        {v.type === 'number' && <NumberInput value={typeof currentValue === 'number' ? currentValue : Number(currentValue ?? 0)} onChange={onChange} />}
        {v.type === 'string' && <StringInput value={typeof currentValue === 'string' ? currentValue : ''} onChange={(v: string) => onChange(v)} />}
      </div>
    </div>
  )
}

// ─── Controls ─────────────────────────────────────────────────────────────────

function BooleanToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        ...mono,
        fontSize: 10,
        padding: '3px 10px',
        background: value ? 'rgba(104,211,145,0.12)' : 'transparent',
        color: value ? 'var(--tag-bool)' : 'var(--ink-dim)',
        border: '1px solid',
        borderColor: value ? 'rgba(104,211,145,0.25)' : 'var(--border)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        minWidth: 52,
        textAlign: 'center' as const,
      }}
    >
      {value ? 'true' : 'false'}
    </button>
  )
}

function TriggerButton({ onClick }: { onClick: () => void }) {
  const [fired, setFired] = useState(false)
  const handleClick = () => {
    onClick()
    setFired(true)
    setTimeout(() => setFired(false), 600)
  }
  return (
    <button
      onClick={handleClick}
      style={{
        ...mono,
        fontSize: 10,
        padding: '3px 10px',
        background: fired ? 'rgba(246,173,85,0.15)' : 'transparent',
        color: fired ? 'var(--tag-trigger)' : 'var(--ink-dim)',
        border: '1px solid',
        borderColor: fired ? 'rgba(246,173,85,0.3)' : 'var(--border)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        minWidth: 52,
        textAlign: 'center' as const,
      }}
    >
      {fired ? 'fired' : 'fire'}
    </button>
  )
}

function EnumSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  if (options.length === 0) {
    return <span style={{ ...mono, fontSize: 11, color: '#888580' }}>{value || '—'}</span>
  }
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...mono,
        fontSize: 11,
        color: 'var(--tag-enum)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        padding: '3px 8px',
        outline: 'none',
        cursor: 'pointer',
        maxWidth: 120,
      }}
    >
      {options.map((o) => (
        <option key={o} value={o} style={{ background: '#161616' }}>{o}</option>
      ))}
    </select>
  )
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 120 }}>
      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          flex: 1,
          WebkitAppearance: 'none',
          appearance: 'none',
          height: 2,
          background: `linear-gradient(to right, #63b3ed ${value}%, #252525 ${value}%)`,
          outline: 'none',
          cursor: 'pointer',
          borderRadius: 0,
        }}
      />
      <span style={{ ...mono, fontSize: 10, color: 'var(--tag-number)', minWidth: 32, textAlign: 'right' as const }}>
        {value.toFixed(1)}
      </span>
    </div>
  )
}

function StringInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value)
  return (
    <input
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onChange(draft)}
      onKeyDown={(e) => { if (e.key === 'Enter') onChange(draft) }}
      style={{
        ...mono,
        fontSize: 11,
        color: 'var(--tag-string)',
        background: 'transparent',
        border: '1px solid var(--border)',
        padding: '3px 8px',
        outline: 'none',
        width: 100,
      }}
    />
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hexOnly = value.length > 7 ? value.slice(0, 7) : value
  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        border: '1px solid var(--border)',
        padding: '3px 8px',
        position: 'relative',
      }}
    >
      <span style={{ width: 14, height: 14, background: value, display: 'inline-block', flexShrink: 0, border: '1px solid rgba(128,128,128,0.2)' }} />
      <span style={{ ...mono, fontSize: 10, color: 'var(--tag-color)' }}>{hexOnly}</span>
      <input
        ref={inputRef}
        type="color"
        value={hexOnly}
        onChange={(e) => onChange(e.target.value)}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
      />
    </div>
  )
}

// ─── CollapsibleSection ───────────────────────────────────────────────────────

const badgeColors: Record<string, { fg: string; border: string }> = {
  main: { fg: '#63b3ed', border: 'rgba(99,179,237,0.2)' },
  vm:   { fg: '#9a75ea', border: 'rgba(154,117,234,0.2)' },
  sm:   { fg: '#68d391', border: 'rgba(104,211,145,0.2)' },
}

function CollapsibleSection({ title, count, badge, children }: {
  title: string
  count: number
  badge?: 'main' | 'vm' | 'sm'
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  const bc = badge ? badgeColors[badge] : null

  return (
    <div style={{ borderBottom: '1px solid var(--border-dim)' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ ...mono, fontSize: 10, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{title}</span>
          {bc && badge && (
            <span style={{ ...mono, fontSize: 9, padding: '1px 5px', color: bc.fg, border: `1px solid ${bc.border}`, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {badge}
            </span>
          )}
          <span style={{ ...mono, fontSize: 9, color: 'var(--ink-faint)' }}>({count})</span>
        </div>
        <span style={{ ...mono, fontSize: 9, color: 'var(--ink-faint)', transition: 'transform 0.15s', display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
      </div>
      {open && <div>{children}</div>}
    </div>
  )
}
