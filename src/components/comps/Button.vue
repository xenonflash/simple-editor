<template>
  <div class="button-comp"
       :style="buttonStyle"
       @mousedown.stop="handleMouseDown"
       :class="{ selected: selected }">
    {{ props.content || '按钮' }}
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue';
import type { CompProps } from './base';

const props = defineProps<{
  id: string;
  selected?: boolean;
  content?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  borderWidth?: number;
  borderStyle?: string;
  borderColor?: string;
  borderRadius?: number;
  fontSize?: number;
  fontWeight?: number | string;
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowSpread?: number;
  shadowColor?: string;
  scale?: number;
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'update', updates: Partial<CompProps>): void;
}>();

const buttonStyle = computed(() => ({
  transform: `translate(${props.x}px, ${props.y}px)`,
  width: props.width ? `${props.width}px` : 'auto',
  height: props.height ? `${props.height}px` : 'auto',
  color: props.color || '#ffffff',
  backgroundColor: props.backgroundColor || '#1890ff',
  borderWidth: `${props.borderWidth || 0}px`,
  borderStyle: props.borderStyle || 'none',
  borderColor: props.borderColor || '#000000',
  borderRadius: `${props.borderRadius || 4}px`,
  fontSize: props.fontSize ? `${props.fontSize}px` : '14px',
  fontWeight: props.fontWeight || 'normal',
  boxShadow: `${props.shadowX || 0}px ${props.shadowY || 0}px ${props.shadowBlur || 0}px ${props.shadowSpread || 0}px ${props.shadowColor || 'rgba(0,0,0,0)'}`,
}));

// 拖动相关的状态
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const startPosX = ref(0);
const startPosY = ref(0);

// 处理鼠标按下事件
function handleMouseDown(e: MouseEvent) {
  // 先触发选中
  emit('select', props.id);
  
  // 开始拖动
  isDragging.value = true;
  startX.value = e.clientX;
  startY.value = e.clientY;
  startPosX.value = props.x;
  startPosY.value = props.y;

  // 添加全局事件监听
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
}

// 处理鼠标移动事件
function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;

  const scale = props.scale || 1;
  const deltaX = (e.clientX - startX.value) / scale;
  const deltaY = (e.clientY - startY.value) / scale;

  emit('update', {
    x: startPosX.value + deltaX,
    y: startPosY.value + deltaY
  });
}

// 处理鼠标松开事件
function handleMouseUp() {
  isDragging.value = false;
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
}

// 组件卸载时清理事件监听
onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
});
</script>

<style scoped>
.button-comp {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 15px;
  cursor: move;
  user-select: none;
}

.button-comp:hover {
  opacity: 0.8;
}

.button-comp.selected {
  outline: 2px solid #1890ff;
  outline-offset: 1px;
}
</style>
