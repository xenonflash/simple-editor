<template>
  <div class="text-comp" 
       :style="style"
       :class="{ selected }"
       @mousedown.stop="$emit('select')">
    {{ props.content }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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

const style = computed(() => ({
  transform: `translate(${props.x}px, ${props.y}px) scale(${props.scale})`,
  color: props.color || '#333',
  fontSize: `${props.fontSize || 14}px`,
  fontWeight: props.fontWeight || 'normal',
  fontFamily: props.fontFamily || 'Arial',
  textDecoration: props.textDecoration || 'none',
  fontStyle: props.fontStyle || 'normal',
  width: props.width ? `${props.width}px` : 'auto',
  height: props.height ? `${props.height}px` : 'auto',
}));

defineEmits(['select', 'update']);
</script>

<style scoped>
.text-comp {
  position: absolute;
  cursor: pointer;
  padding: 4px;
  border: 1px solid transparent;
  white-space: pre-wrap;
  word-break: break-word;
  transform-origin: top left;
  min-width: 20px;
  min-height: 20px;
}

.text-comp.selected {
  border-color: #1890ff;
}
</style>
