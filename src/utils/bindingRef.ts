export type BindingRefKind = 'var' | 'comp' | 'ctx' | 'raw'

export interface ParsedBindingRef {
  kind: BindingRefKind
  raw: string
  // var
  varName?: string
  // comp
  componentId?: string
  propKey?: string
  // ctx
  ctxKey?: string
}

export function parseBindingRef(ref: string): ParsedBindingRef {
  const raw = String(ref || '')
  if (!raw) return { kind: 'raw', raw }

  if (raw.startsWith('var:')) {
    return { kind: 'var', raw, varName: raw.slice('var:'.length) }
  }

  if (raw.startsWith('comp:')) {
    const rest = raw.slice('comp:'.length)
    const parts = rest.split(':')
    const componentId = parts[0]
    const propKey = parts.slice(1).join(':')
    return { kind: 'comp', raw, componentId, propKey }
  }

  if (raw.startsWith('ctx:')) {
    return { kind: 'ctx', raw, ctxKey: raw.slice('ctx:'.length) }
  }

  // 兼容旧数据：直接写变量名
  return { kind: 'var', raw, varName: raw }
}

export interface ResolveBindingRefOptions {
  getVarValue?: (name: string) => any
  getCompProp?: (componentId: string, propKey: string) => any
  context?: any
}

function getByPath(obj: any, path: string): any {
  if (!obj) return undefined
  const raw = String(path || '').trim()
  if (!raw) return undefined
  const parts = raw.split('.').filter(Boolean)
  let cur: any = obj
  for (const part of parts) {
    if (cur == null) return undefined
    cur = cur[part]
  }
  return cur
}

export function resolveBindingRef(ref: string, opts: ResolveBindingRefOptions): any {
  const parsed = parseBindingRef(ref)

  if (parsed.kind === 'var') {
    const name = parsed.varName || ''
    return opts.getVarValue ? opts.getVarValue(name) : undefined
  }

  if (parsed.kind === 'comp') {
    if (!parsed.componentId || !parsed.propKey) return undefined
    return opts.getCompProp ? opts.getCompProp(parsed.componentId, parsed.propKey) : undefined
  }

  if (parsed.kind === 'ctx') {
    const k = parsed.ctxKey
    if (!k) return undefined
    return getByPath(opts.context, k)
  }

  return undefined
}

export interface FormatBindingRefOptions {
  getComponentLabel?: (componentId: string) => string
}

export function formatBindingRefDisplay(ref: string, opts?: FormatBindingRefOptions): string {
  const parsed = parseBindingRef(ref)
  if (!parsed.raw) return ''

  if (parsed.kind === 'var') return parsed.varName || ''

  if (parsed.kind === 'comp') {
    const label = opts?.getComponentLabel ? opts.getComponentLabel(parsed.componentId || '') : (parsed.componentId || '')
    const propKey = parsed.propKey || ''
    return propKey ? `${label}.${propKey}` : label
  }

  if (parsed.kind === 'ctx') {
    const k = parsed.ctxKey || ''
    return k ? `context.${k}` : 'context'
  }

  return parsed.raw
}
