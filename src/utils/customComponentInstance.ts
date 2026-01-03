import type { Comp } from '../components/comps/base'
import { parseBindingRef } from './bindingRef'
import { newComponentId } from './id'

const SOURCE_KEY = 'ccSourceId'

function walk(root: Comp, visit: (c: Comp) => void) {
  const stack: Comp[] = [root]
  while (stack.length) {
    const cur = stack.pop()!
    visit(cur)
    if (cur.children && cur.children.length) {
      for (let i = cur.children.length - 1; i >= 0; i--) stack.push(cur.children[i]!)
    }
  }
}

function buildSourceToExistingId(existingRoot: Comp | undefined): Record<string, string> {
  const map: Record<string, string> = {}
  if (!existingRoot) return map
  walk(existingRoot, (c) => {
    const sid = (c.props as any)?.[SOURCE_KEY]
    if (typeof sid === 'string' && sid) map[sid] = c.id
  })
  return map
}

function remapBindingsInTree(root: Comp, sourceToAssigned: Record<string, string>) {
  walk(root, (c) => {
    const b: any = c.bindings
    if (!b || typeof b !== 'object') return

    for (const [k, v] of Object.entries(b)) {
      if (typeof v !== 'string' || !v) continue
      const parsed = parseBindingRef(v)
      if (parsed.kind !== 'comp' || !parsed.componentId) continue
      const nextId = sourceToAssigned[parsed.componentId]
      if (!nextId) continue
      const propKey = parsed.propKey || ''
      b[k] = propKey ? `comp:${nextId}:${propKey}` : `comp:${nextId}:`
    }
  })
}

/**
 * 用自定义组件 Definition 的 templateRoot 生成一个“实例树”：
 * - 所有节点分配唯一 id
 * - 每个节点写入 ccSourceId = definitionNodeId
 * - 自动重写 bindings 中的 comp:<id>:<prop> 内部引用
 *
 * 如果传入 existingInstanceRoot，会尽量复用其内部节点 id（通过 ccSourceId 对齐）。
 * fixedIdBySourceId 可强制某些 sourceId 使用指定 id（例如同步时固定根 id）。
 */
export function instantiateFromCustomComponentTemplate(
  templateRoot: Comp,
  opts?: {
    existingInstanceRoot?: Comp
    fixedIdBySourceId?: Record<string, string>
  }
): { root: Comp } {
  const fixed = opts?.fixedIdBySourceId || {}
  const sourceToExistingId = buildSourceToExistingId(opts?.existingInstanceRoot)
  const sourceToAssigned: Record<string, string> = {}

  // 先为每个 template 节点确定 instance id
  walk(templateRoot, (c) => {
    const sourceId = c.id
    const nextProps = (c.props && typeof c.props === 'object') ? c.props : {}
    ;(nextProps as any)[SOURCE_KEY] = sourceId
    c.props = nextProps

    const assigned = fixed[sourceId] || sourceToExistingId[sourceId] || newComponentId(String(c.type))
    sourceToAssigned[sourceId] = assigned
    c.id = assigned
  })

  // 再根据 sourceId->assignedId 关系重写内部 comp: 绑定
  remapBindingsInTree(templateRoot, sourceToAssigned)

  return { root: templateRoot }
}
