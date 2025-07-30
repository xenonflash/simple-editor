<template>
  <div class="container" 
       :class="{ 'is-selected': isSelected }" 
       :style="containerStyle" 
       @mousedown.stop="(e) => handleMouseDown(e, props.x || 0, props.y || 0)"
       @click.stop>
    <slot></slot>
    <template v-if="isSelected">
      <div class="resize-handle top-left" @mousedown.stop="(e) => handleResize('top-left', e)"></div>
      <div class="resize-handle top-right" @mousedown.stop="(e) => handleResize('top-right', e)"></div>
      <div class="resize-handle bottom-left" @mousedown.stop="(e) => handleResize('bottom-left', e)"></div>
      <div class="resize-handle bottom-right" @mousedown.stop="(e) => handleResize('bottom-right', e)"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CompProps } from './base'
import { useDraggable, useResizable } from '../../utils/dragHelper'
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
  backgroundColor?: string // 新增
  gradientType?: 'linear' | 'radial' // 新增
  gradientDirection?: string // 新增
  gradientColor1?: string // 新增
  gradientColor2?: string // 新增
  backgroundImage?: string // 新增
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

// 使用 page store
const pageStore = usePageStore()

// 计算是否选中
const isSelected = computed(() => {
  return pageStore.isComponentSelected(props.id)
})

// 修复 componentSize 的计算
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
    pageStore.selectComponent(props.id, multiSelect)
  },
  onUpdate: (updates) => emit('update', updates)
})

// 使用调整大小工具函数
const { startResize } = useResizable({
  scale: computed(() => props.scale || 1),
  minWidth: 50,
  minHeight: 50,
  onResizeStart: () => {
    // 修复：调整大小时也选中组件
    pageStore.selectComponent(props.id)
  },
  onUpdate: (updates) => emit('update', updates)
})

// 处理调整大小
function handleResize(handle: string, e: MouseEvent) {
  startResize(handle, e, {
    x: props.x || 0,
    y: props.y || 0,
    width: props.width || 100,
    height: props.height || 100
  })
}

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

.container.is-selected {
  position: absolute;
}

.container.is-selected::after {
  content: '';
  position: absolute;
  inset: -2px;
  border: 2px solid #1890ff;
  border-radius: 4px;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  border: 2px solid #1890ff;
  border-radius: 50%;
  z-index: 3;
  pointer-events: auto;
}

.resize-handle:hover {
  background: #1890ff;
  transform: scale(1.2);
  transition: transform 0.2s;
}

.resize-handle.top-left {
  top: -6px;
  left: -6px;
  cursor: nw-resize;
}

.resize-handle.top-right {
  top: -6px;
  right: -6px;
  cursor: ne-resize;
}

.resize-handle.bottom-left {
  bottom: -6px;
  left: -6px;
  cursor: sw-resize;
}

.resize-handle.bottom-right {
  bottom: -6px;
  right: -6px;
  cursor: se-resize;
}

/* 禁止选择文本 */
:global(body.resizing) {
  cursor: inherit;
  user-select: none;
  -webkit-user-select: none;
}
</style>
