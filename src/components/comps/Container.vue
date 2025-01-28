<template>
  <div class="container" 
       :class="{ 'is-selected': selected }"
       :style="containerStyle"
       @mousedown.stop="handleMouseDown"
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

const props = defineProps<{
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  selected?: boolean;
  scale?: number; // 添加缩放比例属性
}>();

const emit = defineEmits<{
  (e: 'select'): void;
  (e: 'update', updates: { x?: number; y?: number; width?: number; height?: number }): void;
}>();

// 拖动状态
const isDragging = ref(false);
const startPos = ref({ x: 0, y: 0 });
const startOffset = ref({ x: 0, y: 0 });
const startSize = ref({ width: 0, height: 0 });

// 调整尺寸状态
const isResizing = ref(false);
const resizeHandle = ref<string | null>(null);

// 组件样式
const containerStyle = computed(() => ({
  width: `${props.width || 200}px`,
  height: `${props.height || 100}px`,
  transform: `translate(${props.x || 0}px, ${props.y || 0}px)`,
  position: 'absolute',
  left: 0,
  top: 0,
  cursor: isResizing.value ? getResizeCursor() : (isDragging.value ? 'grabbing' : 'grab'),
}));

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
  if (isResizing.value) return; // 如果正在调整尺寸，不处理拖动

  // 通知选中
  emit('select');
  
  // 开始拖动
  isDragging.value = true;
  startPos.value = { x: e.clientX, y: e.clientY };
  startOffset.value = { x: props.x || 0, y: props.y || 0 };

  // 添加全局事件监听
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

// 开始调整尺寸
function startResize(handle: string, e: MouseEvent) {
  if (isDragging.value) return; // 如果正在拖动，不处理尺寸调整

  e.stopPropagation(); // 阻止事件冒泡
  isResizing.value = true;
  resizeHandle.value = handle;
  startPos.value = { x: e.clientX, y: e.clientY };
  startSize.value = { 
    width: props.width || 200, 
    height: props.height || 100 
  };
  startOffset.value = { 
    x: props.x || 0, 
    y: props.y || 0 
  };

  // 添加全局事件监听
  document.addEventListener('mousemove', handleResizeMove);
  document.addEventListener('mouseup', handleResizeUp);
}

// 处理调整尺寸移动
function handleResizeMove(e: MouseEvent) {
  if (!isResizing.value) return;

  // 考虑画布缩放比例
  const scale = props.scale || 1;
  const deltaX = (e.clientX - startPos.value.x) / scale;
  const deltaY = (e.clientY - startPos.value.y) / scale;

  const updates: { x?: number; y?: number; width?: number; height?: number } = {};

  switch (resizeHandle.value) {
    case 'top-left':
      updates.width = Math.max(50, startSize.value.width - deltaX);
      updates.height = Math.max(50, startSize.value.height - deltaY);
      updates.x = startOffset.value.x + (startSize.value.width - updates.width);
      updates.y = startOffset.value.y + (startSize.value.height - updates.height);
      break;
    case 'top-right':
      updates.width = Math.max(50, startSize.value.width + deltaX);
      updates.height = Math.max(50, startSize.value.height - deltaY);
      updates.y = startOffset.value.y + (startSize.value.height - updates.height);
      break;
    case 'bottom-left':
      updates.width = Math.max(50, startSize.value.width - deltaX);
      updates.height = Math.max(50, startSize.value.height + deltaY);
      updates.x = startOffset.value.x + (startSize.value.width - updates.width);
      break;
    case 'bottom-right':
      updates.width = Math.max(50, startSize.value.width + deltaX);
      updates.height = Math.max(50, startSize.value.height + deltaY);
      break;
  }

  emit('update', updates);
}

// 处理调整尺寸结束
function handleResizeUp() {
  isResizing.value = false;
  resizeHandle.value = null;
  document.removeEventListener('mousemove', handleResizeMove);
  document.removeEventListener('mouseup', handleResizeUp);
}

// 处理鼠标移动
function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value || isResizing.value) return;

  // 考虑画布缩放比例
  const scale = props.scale || 1;
  const deltaX = (e.clientX - startPos.value.x) / scale;
  const deltaY = (e.clientY - startPos.value.y) / scale;

  emit('update', {
    x: startOffset.value.x + deltaX,
    y: startOffset.value.y + deltaY
  });
}

// 处理鼠标松开
function handleMouseUp() {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
}
</script>

<style scoped>
.container {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: border-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.container::before {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid transparent;
  border-radius: 4px;
  transition: border-color 0.2s;
  pointer-events: none;
}

.container:hover::before {
  border-color: #1890ff;
}

.container.is-selected::before {
  border: 2px solid #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 2px solid #1890ff;
  border-radius: 50%;
  z-index: 1;
}

.resize-handle:hover {
  background: #1890ff;
}

.resize-handle.top-left {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}

.resize-handle.top-right {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}

.resize-handle.bottom-left {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}

.resize-handle.bottom-right {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}
</style>
