<template>
  <div class="button-comp"
       :style="buttonStyle"
       @mousedown.stop="handleMouseDown"
       :class="{ selected: selected }">
    {{ props.content || '按钮' }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CompProps } from './base';
import { useDraggable } from '../../utils/dragHelper';

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
  borderRadiusTopLeft?: number;
  borderRadiusTopRight?: number;
  borderRadiusBottomLeft?: number;
  borderRadiusBottomRight?: number;
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
  borderTopLeftRadius: `${props.borderRadiusTopLeft || 4}px`,
  borderTopRightRadius: `${props.borderRadiusTopRight || 4}px`,
  borderBottomLeftRadius: `${props.borderRadiusBottomLeft || 4}px`,
  borderBottomRightRadius: `${props.borderRadiusBottomRight || 4}px`,
  fontSize: props.fontSize ? `${props.fontSize}px` : '14px',
  fontWeight: props.fontWeight || 'normal',
  boxShadow: props.shadowColor ? `${props.shadowX || 0}px ${props.shadowY || 0}px ${props.shadowBlur || 0}px ${props.shadowSpread || 0}px ${props.shadowColor}` : 'none',
}));

// 使用拖拽工具函数
const { handleMouseDown: startDrag } = useDraggable({
  scale: computed(() => props.scale || 1),
  onDragStart: () => emit('select', props.id),
  onUpdate: (updates) => emit('update', updates)
});

// 处理鼠标按下事件
function handleMouseDown(e: MouseEvent) {
  startDrag(e, props.x, props.y);
}
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
  transition: all 0.2s;
}

.button-comp:hover {
  opacity: 0.9;
  box-shadow: 0 0 0 1px rgba(24, 144, 255, 0.2);
}

.button-comp.selected {
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.4);
}

.button-comp.selected:hover {
  opacity: 0.9;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.6);
}

/* 文字选中效果 */
.button-comp::selection,
.button-comp *::selection {
  background: rgba(24, 144, 255, 0.2);
  color: inherit;
}

/* 拖动时的效果 */
.button-comp:active {
  cursor: grabbing;
  opacity: 0.8;
}
</style>
