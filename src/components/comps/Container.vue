<template>
    <div class="container" 
    ref="rootRef"
      :data-comp-id="props.id"
       :style="[containerStyle, autoLayoutStyle]" 
       @mousedown.stop="onMouseDown"
       @click.stop>
    <template v-if="props.comp?.children?.length">
      <template v-for="(child, index) in props.comp.children" :key="child.id">
        <template v-for="rep in getRenderRepeatsForChild(child, index)" :key="rep.key">
          <div class="child-wrapper" v-show="rep.visible" :style="{ zIndex: rep.zIndex }">
            <ComponentRenderer
              :comp="rep.comp"
              :instanceId="rep.instanceId"
              :bindingContext="rep.bindingContext"
              :scale="props.scale || 1"
              :offsetX="rep.offsetX"
              :offsetY="rep.offsetY"
              :inFlowLayout="effectiveLayoutMode !== 'manual'"
              :locked="lockedForChildren"
              @update="onChildUpdate"
            />
          </div>
        </template>
      </template>
    </template>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, ref, watch } from 'vue'
import type { Comp, CompProps } from './base'
import { useDraggable } from '../../utils/dragHelper'
import { usePageStore } from '../../stores/page'
import { resolveBindingRef } from '../../utils/bindingRef'
import { useMeasuredSize } from '../../utils/useMeasuredSize'
import { COORDINATE_HELPER_KEY } from '../../utils/coordinateHelper'
import { parseLoopInstanceId } from '../../utils/loopInstance'
import ComponentRenderer from './ComponentRenderer.vue'
import {
  mergeBindingContext,
  getCustomPropsBindingContext,
  getRenderedProps as getRenderedPropsUtil,
  createBindingResolver,
  getRenderRepeatsForChild as getRenderRepeatsForChildUtil,
  type RenderRepeat
} from '../../utils/renderLoop'

defineOptions({ name: 'Container' })

const props = defineProps<{
  id: string
  comp: Comp
  width?: number
  height?: number
  x?: number
  y?: number
  scale?: number
  inFlowLayout?: boolean

  widthSizing?: 'fixed' | 'fill' | 'content'
  heightSizing?: 'fixed' | 'fill' | 'content'

  layoutMode?: 'manual' | 'auto'
  direction?: 'row' | 'column'
  primaryAlign?: string
  crossAlign?: string
  gap?: number

  borderWidth?: number
  borderStyle?: string
  borderColor?: string
  borderRadiusTopLeft?: number
  borderRadiusTopRight?: number
  borderRadiusBottomLeft?: number
  borderRadiusBottomRight?: number
  shadowX?: number
  shadowY?: number
  shadowBlur?: number
  shadowSpread?: number
  shadowColor?: string
  shadowInset?: boolean
  background?: string
  backgroundColor?: string
  gradientType?: 'linear' | 'radial'
  gradientDirection?: string
  gradientColor1?: string
  gradientColor2?: string
  backgroundImage?: string
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  padding?: { top: number; right: number; bottom: number; left: number }
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number

  bindingContext?: any

  // page 模式下：如果组件处于自定义组件实例内部，则锁定交互（不可拖拽/编辑）
  locked?: boolean
}>()

const emit = defineEmits<{
  (e: 'update', payload: { id: string; updates: Partial<CompProps> }): void
}>()

// 代理更新事件
function onChildUpdate(payload: { id: string; updates: Partial<CompProps> }) {
  emit('update', payload)
}

const pageStore = usePageStore()
const effectiveLayoutMode = computed(() => props.layoutMode || 'manual')

// 映射对齐值到CSS值
function mapPrimaryAlign(value: string): string {
  const map: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    evenly: 'space-evenly'
  }
  return map[value] || 'flex-start'
}

function mapCrossAlign(value: string): string {
  const map: Record<string, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch'
  }
  return map[value] || 'stretch'
}

const isCustomComponentInstanceRoot = computed(() => {
  return !!props.comp?.custom?.defId
})

const lockedForSelf = computed(() => {
  return !!props.locked
})

const lockedForChildren = computed(() => {
  // 1) 祖先已经锁定，则子孙继续锁定
  if (lockedForSelf.value) return true
  // 2) page 模式下，自定义组件实例根之下的所有子组件锁定
  return pageStore.editorMode === 'page' && isCustomComponentInstanceRoot.value
})

const coord = inject(COORDINATE_HELPER_KEY, null)

const rootRef = ref<HTMLElement | null>(null)

useMeasuredSize({ elementRef: rootRef, componentId: props.id })

function measureDescendantPositions() {
  if (!coord) return
  const el = rootRef.value
  if (!el) return

  // 仅在非 absolute 布局下需要依赖 DOM 布局位置
  if (effectiveLayoutMode.value === 'manual') return

  const nodes = Array.from(el.querySelectorAll('[data-comp-id]')) as HTMLElement[]
  const patches: Comp[] = []
  for (const node of nodes) {
    const id = node.getAttribute('data-comp-id')
    if (!id || id === props.id) continue

    const info = parseLoopInstanceId(id)
    // loop 实例会渲染多份 DOM：在 flow/flex 下若把所有实例的位置都写回同一个 source，会导致更新风暴（甚至卡死）。
    // 约定：仅 index=0 的实例参与写回。
    if (info.index !== null && info.index !== 0) continue

    const comp = pageStore.getComponentById(id)
    if (!comp) continue

    const rect = node.getBoundingClientRect()
    const canvasPos = coord.clientToCanvas({ x: rect.left, y: rect.top })

    const prevX = (comp.props as any)._measuredCanvasX
    const prevY = (comp.props as any)._measuredCanvasY

    // 避免频繁抖动更新
    const changed =
      !Number.isFinite(prevX) ||
      !Number.isFinite(prevY) ||
      Math.abs(canvasPos.x - prevX) > 1 ||
      Math.abs(canvasPos.y - prevY) > 1

    if (!changed) continue

    patches.push({
      ...comp,
      props: {
        ...comp.props,
        _measuredCanvasX: canvasPos.x,
        _measuredCanvasY: canvasPos.y
      }
    })
  }

  if (patches.length > 0) {
    pageStore.updateComponentsInCurrentPage(patches)
  }
}

watch(
  () => [effectiveLayoutMode.value, props.direction, props.primaryAlign, props.crossAlign, props.gap, props.paddingTop, props.paddingRight, props.paddingBottom, props.paddingLeft, props.comp?.children?.length],
  () => {
    nextTick(() => {
      measureDescendantPositions()
    })
  },
  { immediate: true }
)

// 计算组件尺寸
const componentSize = computed(() => {
  const width = props.width || 100
  const height = props.height || 100
  return { width, height }
})

// 使用拖拽功能
const { handleMouseDown } = useDraggable({
  scale: computed(() => props.scale || 1),
  componentId: props.id,
  componentSize: componentSize,
  onDragStart: () => {
    const event = window.event as MouseEvent
    const multiSelect = event?.ctrlKey || event?.metaKey
    
    // 修复：只有在组件未被选中时才进行选中操作
    if (!pageStore.isComponentSelected(props.id)) {
      // 组件未选中，正常选中逻辑
      pageStore.selectComponent(props.id, multiSelect)
    } else if (multiSelect) {
      // 组件已选中且按住多选键，取消选中
      pageStore.selectComponent(props.id, true)
    }
    // 如果组件已选中且没按多选键，保持当前选中状态不变
  },
  onUpdate: (updates) => emit('update', { id: props.id, updates })
})

function onMouseDown(e: MouseEvent) {
  if (lockedForSelf.value) {
    const multiSelect = e.ctrlKey || e.metaKey
    if (!pageStore.isComponentSelected(props.id)) {
      pageStore.selectComponent(props.id, multiSelect)
    } else if (multiSelect) {
      pageStore.selectComponent(props.id, true)
    }
    return
  }

  // 在 flow/flex 模式下：容器本身不做拖拽（但允许选中）
  if (props.inFlowLayout) {
    const multiSelect = e.ctrlKey || e.metaKey
    if (!pageStore.isComponentSelected(props.id)) {
      pageStore.selectComponent(props.id, multiSelect)
    } else if (multiSelect) {
      pageStore.selectComponent(props.id, true)
    }
    return
  }

  // 只在点击容器背景时拖拽，避免拖动子元素时拖动容器
  if (e.target !== e.currentTarget) {
    return
  }
  handleMouseDown(e, props.x || 0, props.y || 0)
}

// 使用公共模块的本地绑定上下文
const localBindingContext = computed(() => {
  const base = props.bindingContext || {}
  const custom = props.comp?.custom
  const resolver = createBindingResolver(base)
  const customCtx = getCustomPropsBindingContext(props.comp, base, resolver)
  return mergeBindingContext(base, customCtx)
})

// 使用公共模块的工具函数
function getRenderedProps(comp: Comp, context?: any): Record<string, any> {
  const ctx = context ?? localBindingContext.value
  const resolver = createBindingResolver(ctx)
  return getRenderedPropsUtil(comp, ctx, resolver)
}

// 使用公共模块的循环渲染函数
function getRenderRepeatsForChild(child: Comp, index: number): RenderRepeat[] {
  return getRenderRepeatsForChildUtil(child, index, localBindingContext.value)
}

// 计算容器样式
const containerStyle = computed(() => {
  const style: Record<string, string> = {
    position: props.inFlowLayout ? 'relative' : 'absolute',
    width: props.widthSizing === 'fill'
      ? '100%'
      : props.widthSizing === 'content'
        ? 'fit-content'
        : `${props.width || 100}px`,
    height: props.heightSizing === 'fill'
      ? '100%'
      : props.heightSizing === 'content'
        ? 'fit-content'
        : `${props.height || 100}px`,
    display: effectiveLayoutMode.value === 'auto' ? 'flex' : 'block'
  }

  if (!props.inFlowLayout) {
    style.left = `${props.x || 0}px`
    style.top = `${props.y || 0}px`
  }

  if (effectiveLayoutMode.value === 'auto') {
    style.flexDirection = props.direction === 'column' ? 'column' : 'row'
    style.justifyContent = mapPrimaryAlign(props.primaryAlign || 'start')
    style.alignItems = mapCrossAlign(props.crossAlign || 'stretch')
    if (typeof props.gap === 'number') {
      style.gap = `${props.gap}px`
    }
  }

  // 边框样式
  if (props.borderWidth && props.borderStyle && props.borderStyle !== 'none') {
    style.border = `${props.borderWidth}px ${props.borderStyle} ${props.borderColor || '#000'}`
  }

  // 边框圆角
  if (props.borderRadiusTopLeft || props.borderRadiusTopRight || props.borderRadiusBottomLeft || props.borderRadiusBottomRight) {
    style.borderRadius = `${props.borderRadiusTopLeft || 0}px ${props.borderRadiusTopRight || 0}px ${props.borderRadiusBottomRight || 0}px ${props.borderRadiusBottomLeft || 0}px`
  }

  // 阴影
  if (props.shadowX || props.shadowY || props.shadowBlur || props.shadowSpread) {
    const shadowInset = props.shadowInset ? 'inset ' : ''
    style.boxShadow = `${shadowInset}${props.shadowX || 0}px ${props.shadowY || 0}px ${props.shadowBlur || 0}px ${props.shadowSpread || 0}px ${props.shadowColor || '#000000'}`
  }

  // 背景色
  if (props.backgroundColor) {
    style.backgroundColor = props.backgroundColor
  }

  // 渐变背景
  if (props.gradientType && props.gradientColor1 && props.gradientColor2) {
    const direction = props.gradientDirection || 'to right'
    if (props.gradientType === 'linear') {
      style.background = `linear-gradient(${direction}, ${props.gradientColor1}, ${props.gradientColor2})`
    } else if (props.gradientType === 'radial') {
      style.background = `radial-gradient(circle, ${props.gradientColor1}, ${props.gradientColor2})`
    }
  }

  // 背景图片
  if (props.backgroundImage) {
    style.backgroundImage = `url(${props.backgroundImage})`
    style.backgroundSize = 'cover'
    style.backgroundPosition = 'center'
  }

  // 内边距 - 支持对象格式和独立属性格式
  const paddingObj = props.padding
  const paddingTop = props.paddingTop ?? paddingObj?.top ?? 0
  const paddingRight = props.paddingRight ?? paddingObj?.right ?? 0
  const paddingBottom = props.paddingBottom ?? paddingObj?.bottom ?? 0
  const paddingLeft = props.paddingLeft ?? paddingObj?.left ?? 0

  if (paddingTop || paddingRight || paddingBottom || paddingLeft) {
    style.padding = `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`
  }

  // 外边距
  if (props.marginTop || props.marginRight || props.marginBottom || props.marginLeft) {
    style.margin = `${props.marginTop || 0}px ${props.marginRight || 0}px ${props.marginBottom || 0}px ${props.marginLeft || 0}px`
  }

  return style
})

// 自动布局模式下使用测量值设置内联样式
const autoLayoutStyle = computed(() => {
  if (effectiveLayoutMode.value !== 'auto') return {}
  const measuredW = (props as any)._measuredWidth
  const measuredH = (props as any)._measuredHeight
  const result: Record<string, string> = {}
  if (measuredW) result.width = `${measuredW}px`
  if (measuredH) result.height = `${measuredH}px`
  return result
})
</script>

<style scoped>
.container {
  background: #ffffff;
  user-select: none;
  pointer-events: auto;
  box-sizing: border-box;
}

.child-wrapper {
  position: relative;
}
</style>
