<template>
  <div class="button-comp"
       :style="buttonStyle"
       @mousedown.stop="handleMouseDown"
       :class="{ selected: isSelected }">
    {{ props.content || '按钮' }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CompProps } from './base';
import { useDraggable } from '../../utils/dragHelper';
import { usePageStore } from '../../stores/page';

const props = defineProps<{
  id: string;
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
  (e: 'update', updates: Partial<CompProps>): void;
}>();

// 使用 page store
const pageStore = usePageStore();

// 计算是否选中
const isSelected = computed(() => {
  return pageStore.isComponentSelected(props.id);
});

// 添加缺失的 componentSize 计算
const componentSize = computed(() => {
  return {
    width: props.width || 100,
    height: props.height || 32
  };
});

// 使用新的拖拽工具函数
const { handleMouseDown: startDrag } = useDraggable({
  scale: computed(() => props.scale || 1),
  componentId: props.id,
  componentSize: componentSize,
  onDragStart: () => {
    const event = window.event as MouseEvent;
    const multiSelect = event?.ctrlKey || event?.metaKey;
    pageStore.selectComponent(props.id, multiSelect);
  },
  onUpdate: (updates) => emit('update', updates)
});

// 处理鼠标按下事件
function handleMouseDown(e: MouseEvent) {
  startDrag(e, props.x, props.y);
}

// 计算按钮样式
const buttonStyle = computed(() => {
  return {
    transform: `translate(${props.x}px, ${props.y}px)`,
    width: `${props.width || 100}px`,
    height: `${props.height || 32}px`,
    color: props.color || '#333',
    backgroundColor: props.backgroundColor || '#fff',
    borderWidth: `${props.borderWidth || 1}px`,
    borderStyle: props.borderStyle || 'solid',
    borderColor: props.borderColor || '#d9d9d9',
    borderRadius: [
      props.borderRadiusTopLeft || 4,
      props.borderRadiusTopRight || 4,
      props.borderRadiusBottomRight || 4,
      props.borderRadiusBottomLeft || 4
    ].join('px ') + 'px',
    fontSize: `${props.fontSize || 14}px`,
    fontWeight: props.fontWeight || 'normal',
    boxShadow: props.shadowColor ? 
      `${props.shadowX || 0}px ${props.shadowY || 0}px ${props.shadowBlur || 0}px ${props.shadowSpread || 0}px ${props.shadowColor}` : 
      'none'
  };
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
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.button-comp.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 1px #1890ff;
}
</style>
