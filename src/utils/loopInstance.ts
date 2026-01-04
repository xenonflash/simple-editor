export type LoopInstanceInfo = {
  /** 源组件 id */
  sourceId: string
  /** 循环下标（若是 loop 实例） */
  index: number | null
}

/**
 * 解析 loop 实例 id。
 * 约定：实例 id = `${sourceId}__loop__${index}`
 */
export function parseLoopInstanceId(id: string): LoopInstanceInfo {
  const marker = '__loop__'
  const at = id.indexOf(marker)
  if (at <= 0) return { sourceId: id, index: null }

  const sourceId = id.slice(0, at)
  const tail = id.slice(at + marker.length)
  const idx = Number(tail)
  if (!Number.isFinite(idx) || String(idx) !== tail) return { sourceId: id, index: null }
  return { sourceId, index: idx }
}

export function getLoopSourceId(id: string): string {
  return parseLoopInstanceId(id).sourceId
}

export function isLoopInstanceId(id: string): boolean {
  return parseLoopInstanceId(id).index !== null
}
