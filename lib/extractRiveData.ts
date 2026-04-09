export type BindingType = 'boolean' | 'trigger' | 'enum' | 'color' | 'string' | 'number'

export interface DataBindingVar {
  name: string
  type: BindingType
  value?: string | boolean | number
  source: 'viewmodel' | 'statemachine'
  viewModelName?: string
  instanceName?: string
  instanceIndex?: number
  isBoundInstance?: boolean
  nestedPropPath?: string[]
  stateMachineName?: string
  enumValues?: string[]
}

export interface ArtboardInfo {
  name: string
  animations: string[]
  stateMachines: string[]
}

export interface RiveFileData {
  artboards: ArtboardInfo[]
  variables: DataBindingVar[]
  defaultViewModelName?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolvePropertyType(raw: any): BindingType | null {
  if (typeof raw === 'string') {
    const lower = raw.toLowerCase()
    if (lower === 'boolean') return 'boolean'
    if (lower === 'trigger') return 'trigger'
    if (lower === 'color') return 'color'
    if (lower === 'string') return 'string'
    if (lower === 'enum' || lower === 'enumtype') return 'enum'
    if (lower === 'number') return 'number'
    return null
  }
  const MAP: Record<number, BindingType> = {
    1: 'string',
    2: 'boolean',
    3: 'trigger',
    4: 'color',
    5: 'enum',
    6: 'number',
  }
  return MAP[raw as number] ?? null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractRiveData(rive: any): RiveFileData {
  const artboards = extractArtboards(rive)
  const { variables, defaultViewModelName } = extractViewModelVars(rive)
  if (variables.length === 0) {
    variables.push(...extractSMInputs(rive))
  }
  return { artboards, variables, defaultViewModelName }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractArtboards(rive: any): ArtboardInfo[] {
  const artboards: ArtboardInfo[] = []
  const contents = rive.contents
  if (contents?.artboards) {
    for (const ab of contents.artboards) {
      artboards.push({
        name: ab.name,
        animations: ab.animations?.map((a: { name: string }) => a.name) ?? [],
        stateMachines: ab.stateMachines?.map((sm: { name: string }) => sm.name) ?? [],
      })
    }
  }
  return artboards
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectAllVMPropertyDefs(rive: any): Array<{ name: string; type: BindingType | 'viewModel' }> {
  const vmCount: number = rive.viewModelCount ?? 0
  const seen = new Set<string>()
  const result: Array<{ name: string; type: BindingType | 'viewModel' }> = []
  for (let i = 0; i < vmCount; i++) {
    const v = rive.viewModelByIndex(i)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of (v?.properties ?? []) as any[]) {
      const key = `${p.name}::${p.type}`
      if (seen.has(key)) continue
      seen.add(key)
      const resolved = resolvePropertyType(p.type)
      if (resolved) {
        result.push({ name: p.name, type: resolved })
      } else if (typeof p.type === 'string' && p.type.toLowerCase() === 'viewmodel') {
        result.push({ name: p.name, type: 'viewModel' })
      }
    }
  }
  return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readPrimitiveProp(vmi: any, name: string, type: BindingType): { value: DataBindingVar['value']; enumValues?: string[]; ok: boolean } {
  try {
    if (type === 'boolean') {
      const r = vmi.boolean(name)
      if (r != null) return { value: Boolean(r.value), ok: true }
    } else if (type === 'enum') {
      const r = vmi.enum(name)
      if (r != null) {
        let enumValues: string[] | undefined
        try { enumValues = r.values ? Array.from(r.values as string[]) : [] } catch { /* */ }
        return { value: String(r.value ?? ''), enumValues, ok: true }
      }
    } else if (type === 'color') {
      const r = vmi.color(name)
      if (r != null) return { value: argbToHex(Number(r.value ?? 0)), ok: true }
    } else if (type === 'string') {
      const r = vmi.string(name)
      if (r != null) return { value: String(r.value ?? ''), ok: true }
    } else if (type === 'number') {
      const r = vmi.number(name)
      if (r != null) return { value: Number(r.value ?? 0), ok: true }
    } else if (type === 'trigger') {
      const r = vmi.trigger(name)
      if (r != null) return { value: undefined, ok: true }
    }
  } catch { /* not accessible */ }
  return { value: undefined, ok: false }
}

function extractPropsFromDef(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rive: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vm: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vmi: any,
  isBound: boolean,
  rootIdx: number,
  nestedPath: string[],
  vars: DataBindingVar[],
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: any[] = vm?.properties ?? []
  for (const prop of properties) {
    const type = resolvePropertyType(prop.type)
    if (type) {
      const { value, enumValues, ok } = readPrimitiveProp(vmi, prop.name, type)
      if (!ok && nestedPath.length > 0) continue
      vars.push({
        name: prop.name,
        type,
        value,
        source: 'viewmodel',
        viewModelName: vm.name ?? undefined,
        instanceName: vmi.name ?? undefined,
        instanceIndex: isBound ? undefined : rootIdx,
        isBoundInstance: isBound,
        nestedPropPath: nestedPath.length > 0 ? [...nestedPath] : undefined,
        enumValues,
      })
    } else if (typeof prop.type === 'string' && prop.type.toLowerCase() === 'viewmodel') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nestedVmi: any = vmi.viewModel?.(prop.name)
        if (!nestedVmi) continue
        probeNestedVmi(rive, nestedVmi, isBound, rootIdx, [...nestedPath, prop.name], prop.name, vars)
      } catch { /* not accessible */ }
    }
  }
}

function probeNestedVmi(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rive: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nestedVmi: any,
  isBound: boolean,
  rootIdx: number,
  nestedPath: string[],
  propLabel: string,
  vars: DataBindingVar[],
): void {
  const allProps = collectAllVMPropertyDefs(rive)
  const added = new Set<string>()

  for (const { name, type } of allProps) {
    if (added.has(name)) continue
    if (type === 'viewModel') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const deepVmi: any = nestedVmi.viewModel?.(name)
        if (deepVmi) {
          added.add(name)
          probeNestedVmi(rive, deepVmi, isBound, rootIdx, [...nestedPath, name], name, vars)
        }
      } catch { /* not accessible */ }
    } else {
      const { value, enumValues, ok } = readPrimitiveProp(nestedVmi, name, type)
      if (ok) {
        added.add(name)
        vars.push({
          name,
          type,
          value,
          source: 'viewmodel',
          viewModelName: nestedVmi.name || propLabel,
          instanceName: nestedVmi.name || propLabel,
          instanceIndex: isBound ? undefined : rootIdx,
          isBoundInstance: isBound,
          nestedPropPath: [...nestedPath],
          enumValues,
        })
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractViewModelVars(rive: any): { variables: DataBindingVar[]; defaultViewModelName?: string } {
  const vars: DataBindingVar[] = []
  let defaultViewModelName: string | undefined

  try {
    const vmCount: number = rive.viewModelCount ?? 0
    if (vmCount === 0) return { variables: vars }

    const boundVmi = rive.viewModelInstance ?? null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let defaultVM: any = null
    try { defaultVM = rive.defaultViewModel?.() ?? null } catch { /* not available */ }
    const defaultVMName: string | null = defaultVM?.name ?? null
    if (defaultVMName) defaultViewModelName = defaultVMName

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderedVMs: any[] = []
    if (defaultVM) orderedVMs.push(defaultVM)

    for (const vm of orderedVMs) {
      if (!vm?.properties?.length) continue
      const isMainVM = !!(defaultVMName && vm.name === defaultVMName)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instances: Array<{ vmi: any; isBound: boolean; idx: number }> = []

      if (isMainVM && boundVmi) {
        instances.push({ vmi: boundVmi, isBound: true, idx: -1 })
      }

      const instanceCount: number = vm.instanceCount ?? 0
      for (let idx = 0; idx < instanceCount; idx++) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const vmi: any = vm.instanceByIndex(idx)
          if (!vmi) continue
          if (isMainVM && boundVmi && vmi.name === boundVmi.name) continue
          instances.push({ vmi, isBound: false, idx })
        } catch { /* none */ }
      }

      if (instances.length === 0) continue

      for (const { vmi, isBound, idx } of instances) {
        extractPropsFromDef(rive, vm, vmi, isBound, idx, [], vars)
      }
    }
  } catch { /* ViewModel API unavailable */ }

  return { variables: vars, defaultViewModelName }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSMInputs(rive: any): DataBindingVar[] {
  const vars: DataBindingVar[] = []
  for (const smName of (rive.stateMachineNames ?? []) as string[]) {
    try {
      const inputs = rive.stateMachineInputs(smName) ?? []
      for (const input of inputs) {
        let type: BindingType
        if (input.type === 56) type = 'boolean'
        else if (input.type === 57) type = 'number'
        else type = 'trigger'
        vars.push({
          name: input.name,
          type,
          value: type === 'boolean' ? Boolean(input.value) : type === 'number' ? Number(input.value ?? 0) : undefined,
          source: 'statemachine',
          stateMachineName: smName,
        })
      }
    } catch { /* SM not active */ }
  }
  return vars
}

export function argbToHex(argb: number): string {
  const a = (argb >>> 24) & 0xff
  const r = (argb >>> 16) & 0xff
  const g = (argb >>> 8) & 0xff
  const b = argb & 0xff
  const hex = ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
  return a === 255 ? `#${hex}` : `#${hex}${a.toString(16).padStart(2, '0')}`
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '').slice(0, 6)
  return {
    r: parseInt(clean.substring(0, 2), 16) || 0,
    g: parseInt(clean.substring(2, 4), 16) || 0,
    b: parseInt(clean.substring(4, 6), 16) || 0,
  }
}
