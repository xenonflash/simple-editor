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
                @keydown.esc="cancelEditing"></textarea>
    </div>
    <div v-else>{{ props.content }}</div>
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
}>();

const emit = defineEmits(['select', 'update']);

// 本地状态，用于保持拖动时的流畅性
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const lastX = ref(0);  // 记录上一次的位置
const lastY = ref(0);
const currentX = ref(props.x);
const currentY = ref(props.y);

// 文本编辑状态
const isEditing = ref(false);
const editingContent = ref(props.content);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// 记录拖动开始时的状态
let startState = {
  x: 0,
  y: 0,
  content: ''
};

// 开始编辑
function startEditing() {
  if (props.selected) {
    isEditing.value = true;
    editingContent.value = props.content;
    startState.content = props.content;
    // 等待 DOM 更新后聚焦
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.focus();
      }
    });
  }
}

// 完成编辑
function finishEditing() {
  if (isEditing.value) {
    isEditing.value = false;
    if (editingContent.value !== startState.content) {
      history.addAction({
        type: ActionType.UPDATE,
        componentId: props.id,
        data: {
          before: { props: { content: startState.content } },
          after: { props: { content: editingContent.value } }
        }
      });
      emit('update', { content: editingContent.value });
    }
  }
}

// 取消编辑
function cancelEditing() {
  isEditing.value = false;
  editingContent.value = props.content;
}

// 监听属性变化
watch(() => props.x, (newX) => {
  if (!isDragging.value) {
    currentX.value = newX;
    lastX.value = newX;  // 同步更新lastX
  }
});

watch(() => props.y, (newY) => {
  if (!isDragging.value) {
    currentY.value = newY;
    lastY.value = newY;  // 同步更新lastY
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

  const styleObj: Record<string, string> = {
    transform: `translate(${currentX.value}px, ${currentY.value}px)`,
    color: props.color || '#333',
    fontSize: `${props.fontSize || 14}px`,
    fontWeight: String(props.fontWeight || 'normal'),
    fontFamily: props.fontFamily || 'Arial',
    textDecoration: textDeco,
    fontStyle: props.fontStyle || 'normal',
    width: props.width ? `${props.width}px` : 'auto',
    height: props.height ? `${props.height}px` : 'auto',
    boxShadow
  };

  // 只有在未选中状态下才应用props中的边框样式
  if (!props.selected) {
    styleObj.border = borderStyle !== 'none' ? `${borderWidth} ${borderStyle} ${borderColor}` : 'none';
  }

  return styleObj;
});

// 拖动处理
function handleMouseDown(e: MouseEvent) {
  if (!isEditing.value) {
    if (!props.selected) {
      emit('select');
    }
    isDragging.value = true;
    startX.value = e.clientX;
    startY.value = e.clientY;
    lastX.value = currentX.value;  // 记录开始拖动时的位置
    lastY.value = currentY.value;
    
    // 记录开始状态
    startState = {
      x: props.x,
      y: props.y,
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

  // 考虑缩放因子的影响
  const scale = props.scale || 1;
  const scaledDeltaX = deltaX / scale;
  const scaledDeltaY = deltaY / scale;

  // 基于上一次的位置计算新位置
  currentX.value = lastX.value + scaledDeltaX;
  currentY.value = lastY.value + scaledDeltaY;
}

function handleMouseUp() {
  if (isDragging.value) {
    // 发送更新事件，让父组件处理位置更新
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
