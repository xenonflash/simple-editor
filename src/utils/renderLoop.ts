/**
 * 循环渲染公共模块
 * 提取 Board 和 Container 中重复的循环渲染逻辑
 */
import { usePageStore } from '@/stores/page'
import { useEditorStore } from '@/stores/editor'
import { resolveBindingRef } from '@/utils/bindingRef'
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
      effectiveProps[k] = resolveBindingRef(ref, {
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
      raw[propName] = resolveBindingRef(bindingRef, {
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
  const enabled = raw?.loopEnabled === true
  if (!enabled) return null
  const items = raw?.loopItems
  return Array.isArray(items) ? items : []
}

// ==================== 循环渲染核心 ====================

const LOOP_OFFSET_STEP = 16

export type RenderRepeatsOptions = {
  comp: Comp
  index: number
  baseContext: any
  resolver: BindingResolver
  /** 是否为根层组件（影响 zIndex 计算） */
  isRoot?: boolean
}

/**
 * 生成组件的渲染重复列表
 * - 设计模式：只返回 1 个实例（编辑时简洁）
 * - 预览模式：返回所有循环实例
 */
export function getRenderRepeats(options: RenderRepeatsOptions): RenderRepeat[] {
  const { comp, index, baseContext, resolver, isRoot = false } = options
  const editorStore = useEditorStore()
  
  const visible = isVisibleByRenderControl(comp, baseContext, resolver)
  const zIndex = isRoot
    ? ((comp.props as any)?.zIndex || index + 1000)
    : ((comp.props as any)?.zIndex || 1) + index

  const items = getLoopItems(comp, baseContext, resolver)
  
  // 无循环或禁用循环
  if (!items) {
    return [{
      key: comp.id,
      sourceId: comp.id,
      instanceId: comp.id,
      comp,
      bindingContext: baseContext,
      visible,
      zIndex,
      offsetX: 0,
      offsetY: 0
    }]
  }

  // ⭐ 设计模式：只渲染第一个实例，简化编辑体验
  const renderItems = editorStore.isDesignMode ? items.slice(0, 1) : items

  return renderItems.map((item, i) => {
    // 设计模式下 i 总是 0，无 offset；预览模式下正常 offset
    const actualIndex = editorStore.isDesignMode ? 0 : i
    const instanceId = actualIndex === 0 ? comp.id : `${comp.id}__loop__${actualIndex}`
    const delta = actualIndex <= 0 ? 0 : actualIndex * LOOP_OFFSET_STEP

    let instanceComp: Comp = actualIndex === 0 ? comp : { ...comp, id: instanceId }
    
    // NaiveWrapper 的定位依赖 comp.props.x/y，需要写入 offset
    if (delta !== 0 && typeof comp.type === 'string' && comp.type.startsWith('n-')) {
      const rawX: any = (comp.props as any)?.x
      const rawY: any = (comp.props as any)?.y
      const baseX = typeof rawX === 'number' ? rawX : Number(rawX)
      const baseY = typeof rawY === 'number' ? rawY : Number(rawY)
      instanceComp = {
        ...instanceComp,
        props: {
          ...(comp.props || {}),
          x: (Number.isFinite(baseX) ? baseX : 0) + delta,
          y: (Number.isFinite(baseY) ? baseY : 0) + delta
        }
      }
    }

    return {
      key: instanceId,
      sourceId: comp.id,
      instanceId,
      comp: instanceComp,
      bindingContext: mergeBindingContext(baseContext, { loop: { item, index: actualIndex } }),
      visible,
      zIndex,
      offsetX: delta,
      offsetY: delta
    }
  })
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

/**
 * 为根层组件生成渲染重复列表
 */
export function getRenderRepeatsForRoot(
  comp: Comp,
  index: number,
  parentBindingContext: any
): RenderRepeat[] {
  const resolver = createBindingResolver(parentBindingContext)
  const customCtx = getCustomPropsBindingContext(comp, parentBindingContext, resolver)
  const baseContext = mergeBindingContext(parentBindingContext, customCtx)
  
  return getRenderRepeats({
    comp,
    index,
    baseContext,
    resolver,
    isRoot: true
  })
}

/**
 * 为子组件生成渲染重复列表
 */
export function getRenderRepeatsForChild(
  comp: Comp,
  index: number,
  parentBindingContext: any
): RenderRepeat[] {
  const resolver = createBindingResolver(parentBindingContext)
  
  return getRenderRepeats({
    comp,
    index,
    baseContext: parentBindingContext,
    resolver,
    isRoot: false
  })
}
