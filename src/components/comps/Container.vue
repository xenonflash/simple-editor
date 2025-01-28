<template>
  <div class="container" :class="{ 'is-selected': selected }" :style="containerStyle" @mousedown.stop="handleMouseDown"
    @click.stop>
    <slot></slot>
    <template v-if="selected">
      <div class="resize-handle top-left" @mousedown.stop="startResize('top-left', $event)"></div>
      <div class="resize-handle top-right" @mousedown.stop="startResize('top-right', $event)"></div>
      <div class="resize-handle bottom-left" @mousedown.stop="startResize('bottom-left', $event)"></div>
      <div class="resize-handle bottom-right" @mousedown.stop="startResize('bottom-right', $event)"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { history, ActionType } from '../../utils/history';

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
  (e: 'update', updates: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    borderWidth?: number;
    borderStyle?: string;
    borderColor?: string;
  }): void;
}>();

// 拖动状态
const isDragging = ref(false);
const startPos = ref({ x: 0, y: 0 });
const startOffset = ref({ x: 0, y: 0 });
const startSize = ref({ width: 0, height: 0 });

// 调整尺寸状态
const isResizing = ref(false);
const resizeHandle = ref<string | null>(null);

// 记录拖动开始时的状态
let startState = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};

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

  // 移除所有 undefined 的属性
  Object.keys(style).forEach(key => {
    if (style[key] === undefined) {
      delete style[key];
    }
  });

  return style;
});

// 获取调整尺寸时的光标样式
function getResizeCursor() {
  switch (resizeHandle.value) {
    case 'top-left':
    case 'bottom-right':
      return 'nwse-resize';
    case 'top-right':
    case 'bottom-left':
      return 'nesw-resize';
    default:
      return 'default';
  }
}

// 处理鼠标按下
function handleMouseDown(e: MouseEvent) {
  if (!props.selected) {
    emit('select');
  }
  isDragging.value = true;
  startPos.value = { x: e.clientX, y: e.clientY };
  startOffset.value = { x: props.x || 0, y: props.y || 0 };
  
  // 记录开始状态
  startState = {
    x: props.x || 0,
    y: props.y || 0,
    width: props.width || 100,
    height: props.height || 100
  };
  
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
}

// 处理鼠标移动
function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;

  const scale = props.scale || 1;
  const deltaX = (e.clientX - startPos.value.x) / scale;
  const deltaY = (e.clientY - startPos.value.y) / scale;

  // 只更新位置，保持其他属性不变
  emit('update', {
    x: startOffset.value.x + deltaX,
    y: startOffset.value.y + deltaY
  });
}

// 处理鼠标松开
function handleMouseUp() {
  if (isDragging.value) {
    // 记录位置变更
    const endState = {
      x: props.x || 0,
      y: props.y || 0,
      width: props.width || 100,
      height: props.height || 100
    };
    
    if (endState.x !== startState.x || endState.y !== startState.y) {
      history.addAction({
        type: ActionType.UPDATE,
        componentId: props.id,
        data: {
          before: { props: startState },
          after: { props: endState }
        }
      });
    }
  }
  
  isDragging.value = false;
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
}

// 开始调整尺寸
function startResize(handle: string, e: MouseEvent) {
  e.stopPropagation();
  isResizing.value = true;
  resizeHandle.value = handle;
  startPos.value = { x: e.clientX, y: e.clientY };
  startOffset.value = { x: props.x || 0, y: props.y || 0 };
  startSize.value = {
    width: props.width || 100,
    height: props.height || 100
  };
  
  // 记录开始状态
  startState = {
    x: props.x || 0,
    y: props.y || 0,
    width: props.width || 100,
    height: props.height || 100
  };
  
  window.addEventListener('mousemove', handleResizeMove);
  window.addEventListener('mouseup', handleResizeUp);
  
  // 添加禁止选择类
  document.body.classList.add('resizing');
}

// 处理调整尺寸移动
function handleResizeMove(e: MouseEvent) {
  if (!isResizing.value) return;

  e.preventDefault();
  const scale = props.scale || 1;
  const deltaX = (e.clientX - startPos.value.x) / scale;
  const deltaY = (e.clientY - startPos.value.y) / scale;

  const updates: { x?: number; y?: number; width?: number; height?: number } = {};

  // 计算新的尺寸和位置
  let newWidth = startSize.value.width;
  let newHeight = startSize.value.height;
  let newX = startOffset.value.x;
  let newY = startOffset.value.y;

  switch (resizeHandle.value) {
    case 'top-left':
      newWidth = Math.max(50, startSize.value.width - deltaX);
      newHeight = Math.max(50, startSize.value.height - deltaY);
      newX = startOffset.value.x + startSize.value.width - newWidth;
      newY = startOffset.value.y + startSize.value.height - newHeight;
      break;
    case 'top-right':
      newWidth = Math.max(50, startSize.value.width + deltaX);
      newHeight = Math.max(50, startSize.value.height - deltaY);
      newY = startOffset.value.y + startSize.value.height - newHeight;
      break;
    case 'bottom-left':
      newWidth = Math.max(50, startSize.value.width - deltaX);
      newHeight = Math.max(50, startSize.value.height + deltaY);
      newX = startOffset.value.x + startSize.value.width - newWidth;
      break;
    case 'bottom-right':
      newWidth = Math.max(50, startSize.value.width + deltaX);
      newHeight = Math.max(50, startSize.value.height + deltaY);
      break;
  }

  // 只有当位置或尺寸发生变化时才更新
  if (newX !== props.x) updates.x = newX;
  if (newY !== props.y) updates.y = newY;
  if (newWidth !== props.width) updates.width = newWidth;
  if (newHeight !== props.height) updates.height = newHeight;

  if (Object.keys(updates).length > 0) {
    emit('update', updates);
  }
}

// 处理调整尺寸结束
function handleResizeUp() {
  if (isResizing.value) {
    // 记录尺寸变更
    const endState = {
      x: props.x || 0,
      y: props.y || 0,
      width: props.width || 100,
      height: props.height || 100
    };
    
    if (endState.width !== startState.width || endState.height !== startState.height ||
        endState.x !== startState.x || endState.y !== startState.y) {
      history.addAction({
        type: ActionType.UPDATE,
        componentId: props.id,
        data: {
          before: { props: startState },
          after: { props: endState }
        }
      });
    }
  }
  
  isResizing.value = false;
  resizeHandle.value = null;
  window.removeEventListener('mousemove', handleResizeMove);
  window.removeEventListener('mouseup', handleResizeUp);
  
  // 移除禁止选择类
  document.body.classList.remove('resizing');
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
