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

// ==================== 循环渲染核心 ====================

export const LOOP_OFFSET_STEP = 16

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

  // 渲染所有实例 (设计模式下也显示全部)
  const renderItems = items

  return renderItems.map((item, i) => {
    const actualIndex = i
    const instanceId = actualIndex === 0 ? comp.id : `${comp.id}__loop__${actualIndex}`
    // 计算默认偏移
    const defaultOffset = actualIndex <= 0 ? 0 : actualIndex * LOOP_OFFSET_STEP
    
    // 检查是否有属性覆盖 (loopOverrides)
    const overrides = (comp.props as any)?.loopOverrides?.[String(actualIndex)] || {}
    const hasOverrideX = Object.prototype.hasOwnProperty.call(overrides, 'x')
    const hasOverrideY = Object.prototype.hasOwnProperty.call(overrides, 'y')

    // 基础坐标 (源组件坐标)
    const rawX: any = (comp.props as any)?.x
    const rawY: any = (comp.props as any)?.y
    const baseX = Number(rawX) || 0
    const baseY = Number(rawY) || 0

    // 最终坐标：优先使用 override，否则使用 base + defaultOffset
    const finalX = hasOverrideX ? Number(overrides.x) : (baseX + defaultOffset)
    const finalY = hasOverrideY ? Number(overrides.y) : (baseY + defaultOffset)

    let instanceComp: Comp = actualIndex === 0 ? comp : { ...comp, id: instanceId }
    
    // 应用 override props
    instanceComp = {
        ...instanceComp,
        props: {
            ...(comp.props || {}),
            ...overrides,
            // 确保坐标正确覆盖
            x: finalX,
            y: finalY
        }
    }
    
    // 对于 NaiveWrapper 以外的组件，Renderer 也会读取 props.x/y。
    // 但是现在的逻辑里，Renderer 处理 NaiveWrapper 以外的组件时，会叠加 rep.offsetX。
    // 如果我们已经在这里计算了 finalX/finalY 并写入了 props.x/y，
    // 那么 rep.offsetX 应该是 0 (因为偏移已经包含在 props.x 里了)，
    // 或者我们保持 props.x 为 base，只通过 offset 控制？
    //
    // RenderLoop 返回的 RenderRepeat 包含 { offsetX, offsetY }。
    // Container/Board 使用 ComponentRenderer，传入 offsetX。
    // ComponentRenderer 计算 computedProps: x = rendered.x + offsetX。
    // 
    // 所以：
    // 如果我们把 finalX 写在 instanceComp.props.x，那么 offsetX 应该设为 0。
    // 只有这样，拖拽后保存的绝对坐标才能正确显示，且不会被重复加 offset。
    
    return {
      key: instanceId,
      sourceId: comp.id,
      instanceId,
      comp: instanceComp,
      bindingContext: mergeBindingContext(baseContext, { loop: { item, index: actualIndex } }),
      visible,
      zIndex,
      offsetX: 0, // 坐标已经合并到 props 中，不再依赖外部 offset
      offsetY: 0
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
