<template>
  <div class="container" :class="{ 'is-selected': selected }" :style="containerStyle" @mousedown.stop="handleMouseDown"
    @click.stop>
    <slot></slot>
    <template v-if="selected">
      <div class="resize-handle top-left" @mousedown.stop="(e) => handleResize('top-left', e)"></div>
      <div class="resize-handle top-right" @mousedown.stop="(e) => handleResize('top-right', e)"></div>
      <div class="resize-handle bottom-left" @mousedown.stop="(e) => handleResize('bottom-left', e)"></div>
      <div class="resize-handle bottom-right" @mousedown.stop="(e) => handleResize('bottom-right', e)"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CompProps } from './base';
import { useDraggable, useResizable } from '../../utils/dragHelper';

const props = defineProps<{
  id: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  selected?: boolean;
  scale?: number;
  borderWidth?: number;
  borderStyle?: string;
  borderColor?: string;
  borderRadiusTopLeft?: number;
  borderRadiusTopRight?: number;
  borderRadiusBottomLeft?: number;
  borderRadiusBottomRight?: number;
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowSpread?: number;
  shadowColor?: string;
  shadowInset?: boolean;
  backgroundColor?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}>();

const emit = defineEmits<{
  (e: 'select'): void;
  (e: 'update', updates: Partial<CompProps>): void;
}>();

// 容器样式
const containerStyle = computed(() => {
  const style: Record<string, string> = {
    transform: `translate(${props.x || 0}px, ${props.y || 0}px)`,
  };

  // 设置宽高
  if (props.width !== undefined) {
    style.width = `${props.width}px`;
  }
  if (props.height !== undefined) {
    style.height = `${props.height}px`;
  }

  // 边框样式
  if (props.borderWidth !== undefined && props.borderStyle && props.borderColor) {
    style.border = `${props.borderWidth}px ${props.borderStyle} ${props.borderColor}`;
  }

  // 圆角样式
  style.borderTopLeftRadius = `${props.borderRadiusTopLeft || 0}px`;
  style.borderTopRightRadius = `${props.borderRadiusTopRight || 0}px`;
  style.borderBottomLeftRadius = `${props.borderRadiusBottomLeft || 0}px`;
  style.borderBottomRightRadius = `${props.borderRadiusBottomRight || 0}px`;

  // 阴影效果
  if (props.shadowColor) {
    const x = props.shadowX ?? 0;
    const y = props.shadowY ?? 0;
    const blur = props.shadowBlur ?? 0;
    const spread = props.shadowSpread ?? 0;
    const inset = props.shadowInset ? 'inset ' : '';
    style.boxShadow = `${inset}${x}px ${y}px ${blur}px ${spread}px ${props.shadowColor}`;
  }

  // 背景色
  if (props.backgroundColor) {
    style.backgroundColor = props.backgroundColor;
  }

  // 内边距
  const padding = [];
  padding[0] = props.paddingTop !== undefined ? `${props.paddingTop}px` : '0';
  padding[1] = props.paddingRight !== undefined ? `${props.paddingRight}px` : '0';
  padding[2] = props.paddingBottom !== undefined ? `${props.paddingBottom}px` : '0';
  padding[3] = props.paddingLeft !== undefined ? `${props.paddingLeft}px` : '0';
  style.padding = padding.join(' ');

  // 外边距
  const margin = [];
  margin[0] = props.marginTop !== undefined ? `${props.marginTop}px` : '0';
  margin[1] = props.marginRight !== undefined ? `${props.marginRight}px` : '0';
  margin[2] = props.marginBottom !== undefined ? `${props.marginBottom}px` : '0';
  margin[3] = props.marginLeft !== undefined ? `${props.marginLeft}px` : '0';
  style.margin = margin.join(' ');

  return style;
});

// 使用拖拽工具函数
const { handleMouseDown: startDrag } = useDraggable({
  scale: props.scale,
  onDragStart: () => emit('select'),
  onUpdate: (updates) => emit('update', updates)
});

// 使用调整大小工具函数
const { startResize } = useResizable({
  scale: props.scale,
  minWidth: 50,
  minHeight: 50,
  onResizeStart: () => emit('select'),
  onUpdate: (updates) => emit('update', updates)
});

// 处理鼠标按下事件
function handleMouseDown(e: MouseEvent) {
  startDrag(e, props.x || 0, props.y || 0);
}

// 处理调整大小
function handleResize(handle: string, e: MouseEvent) {
  startResize(handle, e, {
    x: props.x || 0,
    y: props.y || 0,
    width: props.width || 100,
    height: props.height || 100
  });
}
</script>

<style scoped>
.container {
  position: absolute;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  pointer-events: auto;
  z-index: 1;
}

.container.is-selected {
  position: absolute;
  z-index: 2;
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
