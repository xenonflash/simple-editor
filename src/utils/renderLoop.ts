/**
 * 循环渲染公共模块
 * 提取 Board 和 Container 中重复的循环渲染逻辑
 */
import { usePageStore } from '@/stores/page'
import { useEditorStore } from '@/stores/editor'
import { resolveBindingRef, parseBindingRef } from '@/utils/bindingRef'
import type { Comp } from '@/components/comps/base'

// ==================== 类型定义 ====================

export type RenderRepeat = {
  key: string
  sourceId: string
  instanceId: string
  comp: Comp
  bindingContext: any
  visible: boolean
  zIndex: number
  offsetX: number
  offsetY: number
}

export type BindingResolver = {
  getVarValue: (name: string) => any
  getCompProp: (componentId: string, propKey: string) => any
  context?: any
}

// ==================== 绑定上下文工具 ====================

/**
 * 合并绑定上下文
 */
export function mergeBindingContext(base: any, extra: any): any {
  if (!extra) return base
  if (!base) return extra
  return { ...base, ...extra }
}

/**
 * 获取自定义组件的 props/state 绑定上下文
 */
export function getCustomPropsBindingContext(
  comp: Comp,
  baseContext: any,
  resolver: BindingResolver
): any {
  const custom = comp?.custom
  const rawProps = custom?.props
  const rawState = custom?.state
  const bindings = custom?.bindings

  const hasRawProps = rawProps && typeof rawProps === 'object'
  const hasRawState = rawState && typeof rawState === 'object'
  const hasBindings = bindings && typeof bindings === 'object'

  if (!hasRawProps && !hasRawState) return undefined

  const effectiveProps: Record<string, any> = hasRawProps ? { ...rawProps } : {}
  if (hasBindings) {
    for (const [k, ref] of Object.entries(bindings)) {
      if (typeof ref !== 'string' || !ref) continue
      const realRef = ref.startsWith('v-model:') ? ref.substring(8) : ref
      effectiveProps[k] = resolveBindingRef(realRef, {
        ...resolver,
        context: baseContext
      })
    }
  }

  return {
    ...(hasRawProps ? { customProps: effectiveProps, props: effectiveProps } : {}),
    ...(hasRawState ? { customState: rawState, state: rawState } : {})
  }
}

// ==================== 属性求值 ====================

/**
 * 获取组件渲染后的属性（处理绑定）
 */
export function getRenderedProps(
  comp: Comp,
  context: any,
  resolver: BindingResolver
): Record<string, any> {
  const raw = { ...(comp.props || {}) }
  if (comp.bindings) {
    for (const [propName, bindingRef] of Object.entries(comp.bindings)) {
      if (typeof bindingRef !== 'string' || !bindingRef) continue
      const realRef = bindingRef.startsWith('v-model:') ? bindingRef.substring(8) : bindingRef
      raw[propName] = resolveBindingRef(realRef, {
        ...resolver,
        context
      })
    }
  }
  return raw
}

/**
 * 根据渲染控制判断是否可见
 */
export function isVisibleByRenderControl(
  comp: Comp,
  context: any,
  resolver: BindingResolver
): boolean {
  const raw: any = getRenderedProps(comp, context, resolver)
  if (raw && Object.prototype.hasOwnProperty.call(raw, 'renderVisible')) {
    return raw.renderVisible !== false
  }
  return true
}

/**
 * 获取循环数据项
 */
export function getLoopItems(
  comp: Comp,
  context: any,
  resolver: BindingResolver
): any[] | null {
  const raw: any = getRenderedProps(comp, context, resolver)
  const items = raw?.loopItems
  
  if (Array.isArray(items)) {
    return items
  }
  
  // 如果没有绑定数据，使用 loopCount 生成 mock 数据 (默认为1，1视为非循环)
  // 如果 loopCount > 1，生成 mock 数据
  const loopCount = typeof raw?.loopCount === 'number' ? raw.loopCount : 1
  if (loopCount !== 1) {
    if (loopCount <= 0) return [] // 0 不渲染
    
    // 生成智能 Mock 数据
    const mockTemplate: Record<string, any> = { _mockIndex: 0 }
    
    // 扫描组件绑定，查找 loop.item.XXX 的引用，自动生成 Mock 字段
    if (comp.bindings) {
      for (const [key, ref] of Object.entries(comp.bindings)) {
        if (!ref) continue
        // 解析绑定: var:loop.item.name -> name
        const parsed = parseBindingRef(ref)
        if (parsed.kind === 'var' && parsed.varName?.startsWith('loop.item.')) {
          const fieldPath = parsed.varName.slice('loop.item.'.length)
          // 简单的路径支持 (只取第一段，不支持深层嵌套mock)
          const field = fieldPath.split('.')[0]
          if (field) {
            mockTemplate[field] = `Mock ${field}`
          }
        }
      }
    }

    return Array.from({length: loopCount}, (_, i) => ({
      ...mockTemplate,
      _mockIndex: i,
      // 也可以让某些字段带上索引
      ...(Object.keys(mockTemplate).reduce((acc, k) => {
        if (typeof mockTemplate[k] === 'string' && mockTemplate[k].startsWith('Mock ')) {
          acc[k] = `${mockTemplate[k]} ${i + 1}`
        }
        return acc
      }, {} as Record<string, any>))
    }))
  }

  // 兼容旧属性: 仅当明确启用了且 loopCount 没接管时 (这里 loopCount=1)
  // 但我们希望 loopCount=1 且 loopEnabled=true 且无 item 时 -> 返回 null (单例)
  // 保持与 loopCount=1 一致
  
  return null
}



// ==================== 便捷工厂函数 ====================

/**
 * 创建绑定解析器（从 pageStore 自动获取）
 */
export function createBindingResolver(baseContext?: any): BindingResolver {
  const pageStore = usePageStore()
  return {
    getVarValue: (name) => pageStore.getVariableValue(name),
    getCompProp: (componentId, propKey) => pageStore.getComponentById(componentId)?.props?.[propKey],
    context: baseContext
  }
}


