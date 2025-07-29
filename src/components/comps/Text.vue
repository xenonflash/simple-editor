<template>
  <div class="text-comp" 
       :style="style"
       :class="{ selected: props.selected }"
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
                @keydown.backspace.stop></textarea>
    </div>
    <div v-else class="text-content">{{ props.content }}</div>
    
    <!-- 调整手柄 -->
    <div v-if="props.selected && !isEditing" class="resize-handles">
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

const props = defineProps<{
  id: string;
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
  borderWidth?: number;
  borderStyle?: string;
  borderColor?: string;
  shadowX?: number;
  shadowY?: number;
  shadowBlur?: number;
  shadowSpread?: number;
  shadowColor?: string;
  // 新增属性
  widthMode?: 'auto' | 'fixed';
  autoHeight?: boolean;
  // 移除以下两行
  // minWidth?: number;
  // maxWidth?: number;
}>();

const emit = defineEmits(['select', 'update']);

// 本地状态
const isDragging = ref(false);
const isResizing = ref(false);
const resizeDirection = ref('');
const startX = ref(0);
const startY = ref(0);
const lastX = ref(0);
const lastY = ref(0);
const currentX = ref(props.x);
const currentY = ref(props.y);
const currentWidth = ref(props.width || 100);
const currentHeight = ref(props.height || 40);

// 文本编辑状态
const isEditing = ref(false);
const editingContent = ref(props.content);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// 记录开始状态
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
  const width = metrics.width + 8; // 加上padding
  
  // 移除最小最大宽度限制
  return Math.max(20, width); // 只保留基本的最小宽度20px
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
    font-family: ${props.fontFamily || 'Arial'};
    font-weight: ${props.fontWeight || 'normal'};
    font-style: ${props.fontStyle || 'normal'};
    width: ${width}px;
  `;
  tempDiv.textContent = text || '新建文本';
  document.body.appendChild(tempDiv);
  const height = tempDiv.offsetHeight;
  document.body.removeChild(tempDiv);
  
  return Math.max(20, height);
}

// 开始编辑
function startEditing() {
  if (props.selected) {
    isEditing.value = true;
    editingContent.value = props.content;
    startState.content = props.content;
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.focus();
        textareaRef.value.select();
      }
    });
  }
}

// 完成编辑
function finishEditing() {
  if (isEditing.value) {
    isEditing.value = false;
    if (editingContent.value !== startState.content) {
      const updates: any = { content: editingContent.value };
      
      // 如果是自动宽度模式，重新计算宽度
      if (props.widthMode === 'auto') {
        updates.width = calculateTextWidth(editingContent.value);
      }
      
      // 如果是自动高度模式，重新计算高度
      if (props.autoHeight) {
        const width = props.widthMode === 'auto' ? updates.width : (props.width || 100);
        updates.height = calculateTextHeight(editingContent.value, width);
      }
      
      history.addAction({
        type: ActionType.UPDATE,
        componentId: props.id,
        data: {
          before: { props: { content: startState.content } },
          after: { props: updates }
        }
      });
      
      emit('update', updates);
    }
  }
}

// 取消编辑
function cancelEditing() {
  isEditing.value = false;
  editingContent.value = props.content;
}

// 开始调整大小
function startResize(direction: string, e: MouseEvent) {
  isResizing.value = true;
  resizeDirection.value = direction;
  startX.value = e.clientX;
  startY.value = e.clientY;
  
  startState = {
    x: currentX.value,
    y: currentY.value,
    width: currentWidth.value,
    height: currentHeight.value,
    content: props.content
  };
  
  window.addEventListener('mousemove', handleResizeMove);
  window.addEventListener('mouseup', handleResizeUp);
}

// 调整大小移动
function handleResizeMove(e: MouseEvent) {
  if (!isResizing.value) return;
  
  const deltaX = e.clientX - startX.value;
  const deltaY = e.clientY - startY.value;
  const scale = props.scale || 1;
  const scaledDeltaX = deltaX / scale;
  const scaledDeltaY = deltaY / scale;
  
  if (resizeDirection.value.includes('e') && props.widthMode === 'fixed') {
    // 移除最大宽度限制，只保留最小宽度20px
    const newWidth = Math.max(20, startState.width + scaledDeltaX);
    currentWidth.value = newWidth;
  }
  
  if (resizeDirection.value.includes('s') && !props.autoHeight) {
    currentHeight.value = Math.max(20, startState.height + scaledDeltaY);
  }
}

// 调整大小结束
function handleResizeUp() {
  if (isResizing.value) {
    const updates: any = {};
    
    if (currentWidth.value !== startState.width && props.widthMode === 'fixed') {
      updates.width = currentWidth.value;
    }
    
    if (currentHeight.value !== startState.height && !props.autoHeight) {
      updates.height = currentHeight.value;
    }
    
    if (Object.keys(updates).length > 0) {
      emit('update', updates);
    }
  }
  
  isResizing.value = false;
  resizeDirection.value = '';
  window.removeEventListener('mousemove', handleResizeMove);
  window.removeEventListener('mouseup', handleResizeUp);
}

// 监听属性变化
watch(() => props.x, (newX) => {
  if (!isDragging.value && !isResizing.value) {
    currentX.value = newX;
    lastX.value = newX;
  }
});

watch(() => props.y, (newY) => {
  if (!isDragging.value && !isResizing.value) {
    currentY.value = newY;
    lastY.value = newY;
  }
});

watch(() => props.width, (newWidth) => {
  if (!isResizing.value) {
    currentWidth.value = newWidth || 100;
  }
});

watch(() => props.height, (newHeight) => {
  if (!isResizing.value) {
    currentHeight.value = newHeight || 40;
  }
});

// 计算样式
const style = computed(() => {
  // 处理文字装饰样式
  let textDeco = props.textDecoration || 'none';
  if (textDeco !== 'none' && !textDeco.includes(' ')) {
    textDeco = textDeco.split(' ').filter(Boolean).join(' ');
  }

  // 处理边框样式
  const borderStyle = props.borderStyle || 'none';
  const borderWidth = props.borderWidth ? `${props.borderWidth}px` : '0';
  const borderColor = props.borderColor || '#000';

  // 处理阴影样式
  const shadowX = props.shadowX || 0;
  const shadowY = props.shadowY || 0;
  const shadowBlur = props.shadowBlur || 0;
  const shadowSpread = props.shadowSpread || 0;
  const shadowColor = props.shadowColor || '#000000';
  const boxShadow = `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor}`;

  // 计算宽度和高度
  let width: string;
  let height: string;
  
  if (props.widthMode === 'auto') {
    width = `${calculateTextWidth(props.content)}px`;
  } else {
    width = `${currentWidth.value}px`;
  }
  
  if (props.autoHeight) {
    const textWidth = props.widthMode === 'auto' ? calculateTextWidth(props.content) : currentWidth.value;
    height = `${calculateTextHeight(props.content, textWidth)}px`;
  } else {
    height = `${currentHeight.value}px`;
  }

  const styleObj: Record<string, string> = {
    transform: `translate(${currentX.value}px, ${currentY.value}px)`,
    color: props.color || '#333',
    fontSize: `${props.fontSize || 14}px`,
    fontWeight: String(props.fontWeight || 'normal'),
    fontFamily: props.fontFamily || 'Arial',
    textDecoration: textDeco,
    fontStyle: props.fontStyle || 'normal',
    width,
    height,
    boxShadow,
    // 移除以下两行
    // minWidth: `${props.minWidth || 20}px`,
    // maxWidth: `${props.maxWidth || 500}px`
  };

  // 只有在未选中状态下才应用props中的边框样式
  if (!props.selected) {
    styleObj.border = borderStyle !== 'none' ? `${borderWidth} ${borderStyle} ${borderColor}` : 'none';
  }

  return styleObj;
});

// 拖动处理
function handleMouseDown(e: MouseEvent) {
  if (!isEditing.value && !isResizing.value) {
    if (!props.selected) {
      emit('select');
    }
    isDragging.value = true;
    startX.value = e.clientX;
    startY.value = e.clientY;
    lastX.value = currentX.value;
    lastY.value = currentY.value;
    
    startState = {
      x: props.x,
      y: props.y,
      width: props.width || 100,
      height: props.height || 40,
      content: props.content
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;

  const deltaX = e.clientX - startX.value;
  const deltaY = e.clientY - startY.value;

  const scale = props.scale || 1;
  const scaledDeltaX = deltaX / scale;
  const scaledDeltaY = deltaY / scale;

  currentX.value = lastX.value + scaledDeltaX;
  currentY.value = lastY.value + scaledDeltaY;
}

function handleMouseUp() {
  if (isDragging.value) {
    emit('update', {
      x: currentX.value,
      y: currentY.value
    });
  }
  
  isDragging.value = false;
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
}
</script>

<style scoped>
.text-comp {
  position: absolute;
  cursor: move;
  border: 1px solid transparent;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: none;
}

.text-comp.selected {
  border-color: #1890ff;
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
