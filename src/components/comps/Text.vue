<template>
  <div class="text-comp" 
       :style="style"
       :class="{ selected: isSelected }"
       @mousedown.stop="handleMouseDown"
       @dblclick="startEditing">
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
           @mousedown.stop="startResize('se', $event)"></div>
      <!-- 右侧调整手柄（仅固定宽度模式显示） -->
      <div v-if="props.widthMode === 'fixed'" 
           class="resize-handle resize-e" 
           @mousedown.stop="startResize('e', $event)"></div>
      <!-- 底部调整手柄（仅非自动高度模式显示） -->
      <div v-if="!props.autoHeight" 
           class="resize-handle resize-s" 
           @mousedown.stop="startResize('s', $event)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { history, ActionType } from '../../utils/history';
import { useDraggable } from '../../utils/dragHelper';
import { usePageStore } from '../../stores/page'; // 新增
import type { CompProps } from './base';

const props = defineProps<{
  id: string;
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  scale: number;
  // 移除 selected 属性
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

const emit = defineEmits(['update']); // 移除 select 事件

// 使用 page store
const pageStore = usePageStore();

// 计算是否选中
const isSelected = computed(() => {
  return pageStore.isComponentSelected(props.id);
});

// 其他状态变量保持不变
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
    // 选中当前组件（支持多选）
    const event = window.event as MouseEvent;
    const multiSelect = event?.ctrlKey || event?.metaKey;
    pageStore.selectComponent(props.id, multiSelect);
  },
  onUpdate: (updates) => {
    // 更新当前位置用于实时显示
    if (updates.x !== undefined) currentX.value = updates.x
    if (updates.y !== undefined) currentY.value = updates.y
    // 发送更新事件
    emit('update', updates)
  }
})

// 统一的鼠标按下处理
function handleMouseDown(e: MouseEvent) {
  if (!isEditing.value && !isResizing.value) {
    // 使用新的拖拽系统
    dragMouseDown(e, props.x, props.y)
  }
}

// 记录开始状态（用于调整大小）
let startState = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  content: ''
};

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

// 调整大小相关函数保持不变
function startResize(direction: string, e: MouseEvent) {
  isResizing.value = true;
  resizeDirection.value = direction;
  
  startState = {
    x: props.x,
    y: props.y,
    width: currentWidth.value,
    height: currentHeight.value,
    content: props.content
  };
  
  window.addEventListener('mousemove', handleResize);
  window.addEventListener('mouseup', stopResize);
  e.preventDefault();
}

function handleResize(e: MouseEvent) {
  if (!isResizing.value) return;
  
  const scale = props.scale || 1;
  const deltaX = e.movementX / scale;
  const deltaY = e.movementY / scale;
  
  switch (resizeDirection.value) {
    case 'se': // 右下角
      currentWidth.value = Math.max(20, currentWidth.value + deltaX);
      if (!props.autoHeight) {
        currentHeight.value = Math.max(20, currentHeight.value + deltaY);
      }
      break;
    case 'e': // 右侧
      currentWidth.value = Math.max(20, currentWidth.value + deltaX);
      break;
    case 's': // 底部
      if (!props.autoHeight) {
        currentHeight.value = Math.max(20, currentHeight.value + deltaY);
      }
      break;
  }
}

function stopResize() {
  if (isResizing.value) {
    isResizing.value = false;
    
    // 记录调整大小操作到历史
    history.addAction({
      type: ActionType.UPDATE,
      componentId: props.id,
      data: {
        before: { 
          props: {
            x: startState.x,
            y: startState.y,
            width: startState.width,
            height: startState.height
          }
        },
        after: { 
          props: {
            x: props.x,
            y: props.y,
            width: currentWidth.value,
            height: currentHeight.value
          }
        }
      }
    });
    
    emit('update', {
      width: currentWidth.value,
      height: currentHeight.value
    });
    
    window.removeEventListener('mousemove', handleResize);
    window.removeEventListener('mouseup', stopResize);
  }
}

// 文本编辑相关函数保持不变
function startEditing() {
  if (!isSelected.value) return; // 修改：使用 isSelected.value 而不是 props.selected
  
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
  border: 2px solid transparent;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: none;
  transition: border-color 0.2s ease;
}

.text-comp.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 1px #1890ff;
}

.text-content {
  width: 100%;
  height: 100%;
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
