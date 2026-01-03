export function newComponentId(type: string): string {
  const t = String(type || 'comp')
  try {
    // modern browsers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c: any = (globalThis as any).crypto
    if (c && typeof c.randomUUID === 'function') {
      return `${t}_${c.randomUUID()}`
    }
  } catch {
    // ignore
  }
  return `${t}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}
