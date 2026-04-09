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

  if (!data) {
    return (
      <div className="data-panel">
        <div className="data-panel-header">Data Bindings</div>
        <div className="data-panel-body">
          <div className="loading"><div className="spinner" />Loading…</div>
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
      key = v.nestedPropPath?.length
        ? `${v.nestedPropPath.join('.')} (${base})`
        : base
    } else {
      key = v.stateMachineName ?? 'State Machine'
    }
    if (!groups.has(key)) { groups.set(key, []); groupKeys.push(key) }
    groups.get(key)!.push(v)
  }

  return (
    <div className="data-panel">
      <div className="data-panel-header">
        Data Bindings
        {total > 0 && <span className="count">{total}</span>}
      </div>

      <div className="data-panel-body">
        {data.artboards.length > 0 && (
          <div className="artboard-tabs">
            {data.artboards.map((ab) => (
              <button
                key={ab.name}
                className={`artboard-tab ${(selectedArtboard ?? data.artboards[0]?.name) === ab.name ? 'active' : ''}`}
                onClick={() => onArtboardChange(ab.name)}
              >
                {ab.name}
              </button>
            ))}
          </div>
        )}

        {total === 0 && (
          <div className="empty-section" style={{ margin: '24px 20px' }}>
            No data binding variables found.
            <br />
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
              Expected: boolean, number, trigger, enum, color, or string properties.
            </span>
          </div>
        )}

        {groupKeys.map((key) => {
          const items = groups.get(key)!
          const firstVar = items[0]
          const isTopLevelBound = firstVar?.isBoundInstance === true && !firstVar?.nestedPropPath
          const isVM = firstVar?.source === 'viewmodel'
          return (
            <CollapsibleSection
              key={key}
              title={key}
              count={items.length}
              badge={isTopLevelBound ? 'main' : isVM ? 'vm' : 'sm'}
            >
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

interface VarRowProps {
  variable: DataBindingVar
  overrideValue?: DataBindingVar['value']
  onChange: (val: DataBindingVar['value']) => void
}

function VarRow({ variable: v, overrideValue, onChange }: VarRowProps) {
  const currentValue = overrideValue !== undefined ? overrideValue : v.value

  return (
    <div className="data-item">
      <div className="data-item-left">
        <span className={`type-tag ${v.type}`}>{v.type}</span>
        <div className="data-item-meta">
          <span className="data-item-name">{v.name}</span>
          {v.source === 'viewmodel' && v.viewModelName && (
            <span className="data-item-source">{v.viewModelName}</span>
          )}
          {v.source === 'statemachine' && v.stateMachineName && (
            <span className="data-item-source">{v.stateMachineName}</span>
          )}
        </div>
      </div>

      <div className="data-item-control">
        {v.type === 'boolean' && (
          <BooleanToggle value={Boolean(currentValue)} onChange={(val) => onChange(val)} />
        )}
        {v.type === 'trigger' && (
          <TriggerButton onClick={() => onChange(undefined)} />
        )}
        {v.type === 'enum' && (
          <EnumSelect
            value={String(currentValue ?? '')}
            options={v.enumValues ?? []}
            onChange={(val) => onChange(val)}
          />
        )}
        {v.type === 'color' && (
          <ColorPicker
            value={typeof currentValue === 'string' ? currentValue : '#000000'}
            onChange={(val) => onChange(val)}
          />
        )}
        {v.type === 'number' && (
          <NumberInput
            value={typeof currentValue === 'number' ? currentValue : Number(currentValue ?? 0)}
            onChange={(val) => onChange(val)}
          />
        )}
        {v.type === 'string' && (
          <StringInput
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(val: string) => onChange(val)}
          />
        )}
      </div>
    </div>
  )
}

function BooleanToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      className={`bool-toggle ${value ? 'on' : 'off'}`}
      onClick={() => onChange(!value)}
      title={String(value)}
    >
      <span className="bool-toggle-thumb" />
      <span className="bool-toggle-label">{value ? 'true' : 'false'}</span>
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
    <button className={`trigger-btn ${fired ? 'fired' : ''}`} onClick={handleClick}>
      {fired ? 'Fired!' : 'Fire'}
    </button>
  )
}

function EnumSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  if (options.length === 0) {
    return <span className="data-item-value">{value || '—'}</span>
  }
  return (
    <select className="var-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="number-slider-control">
      <input
        className="number-slider"
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="number-slider-value">{typeof value === 'number' ? value.toFixed(1) : value}</span>
    </div>
  )
}

function StringInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value)
  return (
    <input
      className="string-input"
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onChange(draft)}
      onKeyDown={(e) => { if (e.key === 'Enter') onChange(draft) }}
    />
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const hexOnly = value.length > 7 ? value.slice(0, 7) : value
  return (
    <div className="color-control" onClick={() => inputRef.current?.click()}>
      <span className="color-swatch" style={{ background: value }} title={value} />
      <span className="data-item-value">{hexOnly}</span>
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

function CollapsibleSection({
  title, count, badge, children,
}: {
  title: string
  count: number
  badge?: 'main' | 'vm' | 'sm'
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="data-section">
      <div className="data-section-header" onClick={() => setOpen(!open)}>
        <span className="data-section-title">
          {title}
          {badge && <span className={`vm-badge vm-badge-${badge}`}>{badge === 'main' ? 'main' : badge === 'vm' ? 'vm' : 'sm'}</span>}
          <span style={{ opacity: 0.5, fontWeight: 400 }}> ({count})</span>
        </span>
        <span className={`chevron ${open ? 'open' : ''}`}>&#9654;</span>
      </div>
      {open && <div className="data-section-content">{children}</div>}
    </div>
  )
}
