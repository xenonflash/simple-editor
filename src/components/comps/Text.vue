<template>
  <div class="text-comp" 
       :style="style"
       :class="{ selected: isSelected }"
       @mousedown.stop="handleMouseDown"
       @dblclick="startEditing">
    <!-- 选中状态的边框指示器 -->
    <div v-if="isSelected" class="selection-border"></div>
    
    <div v-if="isEditing" 
         class="edit-wrapper"
         @click.stop>
      <textarea ref="textareaRef"
                v-model="editingContent"
                @blur="finishEditing"
                @keydown.enter.exact.prevent="finishEditing"
                @keydown.esc="cancelEditing"
                @keydown.delete.stop
                @keydown.backspace.stop"></textarea>
    </div>
    <div v-else class="text-content">{{ props.content }}</div>
    
    <!-- 调整手柄 -->
    <div v-if="isSelected && !isEditing" class="resize-handles">
      <!-- 右下角调整手柄 -->
      <div class="resize-handle resize-se" 
           @mousedown.stop="handleResize('bottom-right', $event)"></div>
      <!-- 右侧调整手柄（仅固定宽度模式显示） -->
      <div v-if="props.widthMode === 'fixed'" 
           class="resize-handle resize-e" 
           @mousedown.stop="handleResize('top-right', $event)"></div>
      <!-- 底部调整手柄（仅非自动高度模式显示） -->
      <div v-if="!props.autoHeight" 
           class="resize-handle resize-s" 
           @mousedown.stop="handleResize('bottom-left', $event)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { history, ActionType } from '../../utils/history';
import { useDraggable, useResizable } from '../../utils/dragHelper'; // Fix: import useResizable from dragHelper
import { usePageStore } from '../../stores/page';
import type { CompProps } from './base';

const props = defineProps<{
  id: string;
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  scale: number;
  color?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  textDecoration?: string;
  fontStyle?: string;
  borderWidth?: number;
  borderStyle?: string;
  borderColor?: string;
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowSpread?: number;
  shadowColor?: string;
  widthMode?: 'auto' | 'fixed';
  autoHeight?: boolean;
}>();

const emit = defineEmits(['update']);

// 使用 page store
const pageStore = usePageStore();

// 计算是否选中
const isSelected = computed(() => {
  return pageStore.isComponentSelected(props.id);
});

// 状态变量
const isResizing = ref(false);
const resizeDirection = ref('');
const currentX = ref(props.x);
const currentY = ref(props.y);
const currentWidth = ref(props.width || 100);
const currentHeight = ref(props.height || 40);

// 文本编辑状态
const isEditing = ref(false);
const editingContent = ref(props.content);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// 计算组件尺寸
const componentSize = computed(() => {
  const width = props.widthMode === 'auto' ? calculateTextWidth(props.content) : (props.width || 100)
  const height = props.autoHeight ? calculateTextHeight(props.content, width) : (props.height || 40)
  return { width, height }
})

// 使用统一的拖拽系统
const { handleMouseDown: dragMouseDown } = useDraggable({
  scale: computed(() => props.scale || 1),
  componentId: props.id,
  componentSize: componentSize,
  onDragStart: () => {
    const event = window.event as MouseEvent;
    const multiSelect = event?.ctrlKey || event?.metaKey;
    pageStore.selectComponent(props.id, multiSelect);
  },
  onUpdate: (updates) => {
    if (updates.x !== undefined) currentX.value = updates.x
    if (updates.y !== undefined) currentY.value = updates.y
    emit('update', updates)
  }
})

// 使用调整大小功能
const { startResize } = useResizable({
  scale: computed(() => props.scale || 1),
  minWidth: 20,
  minHeight: 20,
  onResizeStart: () => {
    pageStore.selectComponent(props.id);
  },
  onUpdate: (updates) => {
    if (updates.width !== undefined) currentWidth.value = updates.width;
    if (updates.height !== undefined) currentHeight.value = updates.height;
    emit('update', updates);
  }
});

// 统一的鼠标按下处理
function handleMouseDown(e: MouseEvent) {
  if (!isEditing.value && !isResizing.value) {
    dragMouseDown(e, props.x, props.y)
  }
}

// 计算文字实际宽度
function calculateTextWidth(text: string): number {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 100;
  
  context.font = `${props.fontWeight || 'normal'} ${props.fontSize || 14}px ${props.fontFamily || 'Arial'}`;
  const metrics = context.measureText(text || '新建文本');
  const width = metrics.width + 8;
  
  return Math.max(20, width);
}

// 计算文字实际高度
function calculateTextHeight(text: string, width: number): number {
  const tempDiv = document.createElement('div');
  tempDiv.style.cssText = `
    position: absolute;
    visibility: hidden;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: ${props.fontSize || 14}px;
    font-weight: ${props.fontWeight || 'normal'};
    font-family: ${props.fontFamily || 'Arial'};
    width: ${width}px;
    padding: 4px;
  `;
  tempDiv.textContent = text || '新建文本';
  document.body.appendChild(tempDiv);
  const height = tempDiv.offsetHeight;
  document.body.removeChild(tempDiv);
  
  return Math.max(20, height);
}

// 文本编辑相关函数
function startEditing() {
  if (!isSelected.value) return;
  
  isEditing.value = true;
  editingContent.value = props.content;
  
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.focus();
      textareaRef.value.select();
    }
  });
}

function finishEditing() {
  if (editingContent.value !== props.content) {
    history.addAction({
      type: ActionType.UPDATE,
      componentId: props.id,
      data: {
        before: { props: { content: props.content } },
        after: { props: { content: editingContent.value } }
      }
    });
    
    emit('update', { content: editingContent.value });
  }
  
  isEditing.value = false;
}

function cancelEditing() {
  editingContent.value = props.content;
  isEditing.value = false;
}

// Handle resize with proper parameters
function handleResize(direction: string, e: MouseEvent) {
  startResize(direction, e, {
    x: props.x,
    y: props.y,
    width: props.width || 100,
    height: props.height || 40
  });
}

// 样式计算
const style = computed(() => {
  const styleObj: any = {
    transform: `translate(${currentX.value}px, ${currentY.value}px)`,
    color: props.color || '#000000',
    fontSize: props.fontSize ? `${props.fontSize}px` : '14px',
    fontWeight: props.fontWeight || 'normal',
    fontFamily: props.fontFamily || 'Arial',
    textDecoration: props.textDecoration || 'none',
    fontStyle: props.fontStyle || 'normal',
    borderWidth: `${props.borderWidth || 0}px`,
    borderStyle: props.borderStyle || 'none',
    borderColor: props.borderColor || '#000000',
    boxShadow: props.shadowColor ? `${props.shadowX || 0}px ${props.shadowY || 0}px ${props.shadowBlur || 0}px ${props.shadowSpread || 0}px ${props.shadowColor}` : 'none',
  };
  
  // 宽度处理
  if (props.widthMode === 'auto') {
    styleObj.width = 'auto';
    styleObj.minWidth = '20px';
  } else {
    styleObj.width = `${currentWidth.value}px`;
  }
  
  // 高度处理
  if (props.autoHeight) {
    styleObj.height = 'auto';
    styleObj.minHeight = '20px';
  } else {
    styleObj.height = `${currentHeight.value}px`;
  }
  
  return styleObj;
});

// 监听props变化，同步到本地状态
watch(() => props.x, (newX) => {
  currentX.value = newX;
});

watch(() => props.y, (newY) => {
  currentY.value = newY;
});

watch(() => props.width, (newWidth) => {
  if (newWidth !== undefined) {
    currentWidth.value = newWidth;
  }
});

watch(() => props.height, (newHeight) => {
  if (newHeight !== undefined) {
    currentHeight.value = newHeight;
  }
});
</script>

<style scoped>
.text-comp {
  position: absolute;
  cursor: move;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: none;
  transition: border-color 0.2s ease;
}

/* 独立的选中边框指示器 */
.selection-border {
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  border: 1px solid #1890ff;
  pointer-events: none;
  z-index: 1;
}

.text-content {
  position: relative;
  z-index: 2;
}

.edit-wrapper {
  width: 100%;
  height: 100%;
}

.edit-wrapper textarea {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  font: inherit;
  color: inherit;
  padding: 0;
  margin: 0;
}

.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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

.resize-se {
  right: -6px;
  bottom: -6px;
  cursor: se-resize;
}

.resize-e {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  cursor: e-resize;
}

.resize-s {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}
</style>
