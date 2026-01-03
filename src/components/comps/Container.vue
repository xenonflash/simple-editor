<template>
    <div class="container" 
    ref="rootRef"
      :data-comp-id="props.id"
       :style="containerStyle" 
       @mousedown.stop="onMouseDown"
       @click.stop>
    <template v-if="props.comp?.children?.length">
      <template v-for="(child, index) in props.comp.children" :key="child.id">
        <div class="child-wrapper" :style="{ zIndex: (child.props?.zIndex || 1) + index }">
          <Container
            v-if="child.type === 'container'"
            :id="child.id"
            :comp="child"
            v-bind="getRenderedProps(child)"
            :scale="props.scale || 1"
            :inFlowLayout="effectiveLayoutMode !== 'absolute'"
            :locked="lockedForChildren"
            :bindingContext="getBindingContextForChild(child)"
            @update="(payload) => emit('update', payload)"
          />
          <Text
            v-else-if="child.type === 'text'"
            :id="child.id"
            :content="getRenderedProps(child, getBindingContextForChild(child)).content || '新建文本'"
            :x="getRenderedProps(child, getBindingContextForChild(child)).x || 0"
            :y="getRenderedProps(child, getBindingContextForChild(child)).y || 0"
            v-bind="getRenderedProps(child, getBindingContextForChild(child))"
            :scale="props.scale || 1"
            :inFlowLayout="effectiveLayoutMode !== 'absolute'"
            :locked="lockedForChildren"
            @update="(updates) => emit('update', { id: child.id, updates })"
          />
          <Button
            v-else-if="child.type === 'button'"
            :id="child.id"
            :x="getRenderedProps(child, getBindingContextForChild(child)).x || 0"
            :y="getRenderedProps(child, getBindingContextForChild(child)).y || 0"
            v-bind="getRenderedProps(child, getBindingContextForChild(child))"
            :scale="props.scale || 1"
            :inFlowLayout="effectiveLayoutMode !== 'absolute'"
            :locked="lockedForChildren"
            @update="(updates) => emit('update', { id: child.id, updates })"
          />
          <NaiveWrapper
            v-else-if="child.type && child.type.startsWith('n-')"
            :comp="child"
            :scale="props.scale || 1"
            :inFlowLayout="effectiveLayoutMode !== 'absolute'"
            :locked="lockedForChildren"
            :bindingContext="getBindingContextForChild(child)"
            @update="(updates) => emit('update', { id: child.id, updates })"
          />
        </div>
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
import Text from './Text.vue'
import Button from './Button.vue'
import NaiveWrapper from './NaiveWrapper.vue'

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

  layoutMode?: 'absolute' | 'default' | 'flex'
  flexDirection?: 'row' | 'column'
  justifyContent?: string
  alignItems?: string
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

const pageStore = usePageStore()
const effectiveLayoutMode = computed(() => props.layoutMode || 'absolute')

const isCustomComponentInstanceRoot = computed(() => {
  const p: any = props.comp?.props || {}
  return !!p.__customComponentId
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
  if (effectiveLayoutMode.value === 'absolute') return

  const nodes = Array.from(el.querySelectorAll('[data-comp-id]')) as HTMLElement[]
  for (const node of nodes) {
    const id = node.getAttribute('data-comp-id')
    if (!id || id === props.id) continue

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

    pageStore.updateComponentInCurrentPage({
      ...comp,
      props: {
        ...comp.props,
        _measuredCanvasX: canvasPos.x,
        _measuredCanvasY: canvasPos.y
      }
    })
  }
}

watch(
  () => [effectiveLayoutMode.value, props.flexDirection, props.justifyContent, props.alignItems, props.gap, props.paddingTop, props.paddingRight, props.paddingBottom, props.paddingLeft, props.comp?.children?.length],
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

function getRenderedProps(comp: Comp, context?: any): Record<string, any> {
  const raw = { ...(comp.props || {}) }
  const ctx = context ?? getBindingContextForChild(comp)
  if (comp.bindings) {
    for (const [propName, bindingRef] of Object.entries(comp.bindings)) {
      if (typeof bindingRef !== 'string' || !bindingRef) continue
      raw[propName] = resolveBindingRef(bindingRef, {
        getVarValue: (name) => pageStore.getVariableValue(name),
        getCompProp: (componentId, propKey) => pageStore.getComponentById(componentId)?.props?.[propKey],
        context: ctx
      })
    }
  }
  return raw
}

function getBindingContextForChild(comp: Comp): any {
  const base = props.bindingContext
  const p: any = comp?.props || {}
  const customProps = p.__customProps
  if (customProps && typeof customProps === 'object') {
    return base ? { ...base, customProps, props: customProps } : { customProps, props: customProps }
  }
  return base
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
    display: effectiveLayoutMode.value === 'flex' ? 'flex' : 'block'
  }

  if (!props.inFlowLayout) {
    style.left = `${props.x || 0}px`
    style.top = `${props.y || 0}px`
  }

  if (effectiveLayoutMode.value === 'flex') {
    style.flexDirection = props.flexDirection || 'row'
    style.justifyContent = props.justifyContent || 'flex-start'
    style.alignItems = props.alignItems || 'stretch'
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

  // 内边距
  if (props.paddingTop || props.paddingRight || props.paddingBottom || props.paddingLeft) {
    style.padding = `${props.paddingTop || 0}px ${props.paddingRight || 0}px ${props.paddingBottom || 0}px ${props.paddingLeft || 0}px`
  }

  // 外边距
  if (props.marginTop || props.marginRight || props.marginBottom || props.marginLeft) {
    style.margin = `${props.marginTop || 0}px ${props.marginRight || 0}px ${props.marginBottom || 0}px ${props.marginLeft || 0}px`
  }

  return style
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
