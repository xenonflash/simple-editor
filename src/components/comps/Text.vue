<template>
  <div class="text-comp" 
       :style="style"
       :class="{ selected }"
       @mousedown.stop="handleMouseDown">
    {{ content }}
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  scale: number;
  selected: boolean;
  color?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  textDecoration?: string;
  fontStyle?: string;
}>();

const emit = defineEmits(['select', 'update']);

// 本地状态，用于保持拖动时的流畅性
const content = ref(props.content);
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const currentX = ref(props.x);
const currentY = ref(props.y);

// 监听属性变化
watch(() => props.content, (newContent) => {
  content.value = newContent;
});

watch(() => props.x, (newX) => {
  if (!isDragging.value) {
    currentX.value = newX;
  }
});

watch(() => props.y, (newY) => {
  if (!isDragging.value) {
    currentY.value = newY;
  }
});

// 计算样式
const style = computed(() => ({
  transform: `translate(${currentX.value}px, ${currentY.value}px) scale(${props.scale})`,
  color: props.color || '#333',
  fontSize: `${props.fontSize || 14}px`,
  fontWeight: props.fontWeight || 'normal',
  fontFamily: props.fontFamily || 'Arial',
  textDecoration: props.textDecoration || 'none',
  fontStyle: props.fontStyle || 'normal',
  width: props.width ? `${props.width}px` : 'auto',
  height: props.height ? `${props.height}px` : 'auto',
}));

// 拖动处理
function handleMouseDown(e: MouseEvent) {
  emit('select');
  
  isDragging.value = true;
  startX.value = e.clientX;
  startY.value = e.clientY;

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;

  const deltaX = e.clientX - startX.value;
  const deltaY = e.clientY - startY.value;

  currentX.value = props.x + deltaX;
  currentY.value = props.y + deltaY;
}

function handleMouseUp() {
  if (!isDragging.value) return;

  isDragging.value = false;
  emit('update', {
    props: {
      x: currentX.value,
      y: currentY.value
    }
  });

  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
}
</script>

<style scoped>
.text-comp {
  position: absolute;
  cursor: move;
  padding: 4px;
  border: 1px solid transparent;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: none;
}

.text-comp.selected {
  border-color: #1890ff;
}
</style>
