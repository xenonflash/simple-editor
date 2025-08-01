<template>
  <div class="container" 
       :style="containerStyle" 
       @mousedown.stop="(e) => handleMouseDown(e, props.x || 0, props.y || 0)"
       @click.stop>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CompProps } from './base'
import { useDraggable } from '../../utils/dragHelper'
import { usePageStore } from '../../stores/page'

const props = defineProps<{
  id: string
  width?: number
  height?: number
  x?: number
  y?: number
  scale?: number
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
}>()

const emit = defineEmits<{
  (e: 'update', updates: Partial<CompProps>): void
}>()

const pageStore = usePageStore()

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
  onUpdate: (updates) => emit('update', updates)
})

// 计算容器样式
const containerStyle = computed(() => {
  const style: Record<string, string> = {
    left: `${props.x || 0}px`,
    top: `${props.y || 0}px`,
    width: `${props.width || 100}px`,
    height: `${props.height || 100}px`
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
  position: absolute;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  pointer-events: auto;
}
</style>
