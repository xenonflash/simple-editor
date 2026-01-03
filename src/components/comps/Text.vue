<template>
    <div class="text-comp" 
    ref="rootRef"
      :data-comp-id="props.id"
       :style="style"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import type { CompProps } from './base'
import { useDraggable } from '../../utils/dragHelper'
import { usePageStore } from '../../stores/page'
import { history, ActionType } from '../../utils/history'
import { useMeasuredSize } from '../../utils/useMeasuredSize'

const props = defineProps<{
  id: string;
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  widthSizing?: 'fixed' | 'fill' | 'content';
  heightSizing?: 'fixed' | 'fill' | 'content';
  scale: number;
  inFlowLayout?: boolean;
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

const emit = defineEmits<{
  (e: 'update', updates: Partial<CompProps>): void
}>()

const pageStore = usePageStore()

const rootRef = ref<HTMLElement | null>(null)

useMeasuredSize({ elementRef: rootRef, componentId: props.id })

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
    
    // 修复：只有在组件未被选中时才进行选中操作
    if (!pageStore.isComponentSelected(props.id)) {
      // 组件未选中，正常选中逻辑
      pageStore.selectComponent(props.id, multiSelect);
    } else if (multiSelect) {
      // 组件已选中且按住多选键，取消选中
      pageStore.selectComponent(props.id, true);
    }
    // 如果组件已选中且没按多选键，保持当前选中状态不变
  },
  onUpdate: (updates) => {
    if (updates.x !== undefined) currentX.value = updates.x
    if (updates.y !== undefined) currentY.value = updates.y
    emit('update', updates)
  }
})

// 统一的鼠标按下处理
function handleMouseDown(e: MouseEvent) {
  if (props.inFlowLayout) {
    const multiSelect = e.ctrlKey || e.metaKey;
    if (!pageStore.isComponentSelected(props.id)) {
      pageStore.selectComponent(props.id, multiSelect);
    } else if (multiSelect) {
      pageStore.selectComponent(props.id, true);
    }
    return;
  }
  if (!isEditing.value) {
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

// 样式计算
const style = computed(() => {
  const styleObj: any = {
    transform: props.inFlowLayout ? 'none' : `translate(${currentX.value}px, ${currentY.value}px)`,
    position: props.inFlowLayout ? 'relative' : 'absolute',
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

  // 容器内 flow/flex：不走绝对定位
  if (props.inFlowLayout) {
    styleObj.left = 'auto';
    styleObj.top = 'auto';
    styleObj.cursor = 'default';
  }

  // 宽高 sizing（优先级高于 widthMode/autoHeight）
  if (props.widthSizing === 'fill') {
    styleObj.width = '100%';
  } else if (props.widthSizing === 'content') {
    styleObj.width = 'fit-content';
  }

  if (props.heightSizing === 'fill') {
    styleObj.height = '100%';
  } else if (props.heightSizing === 'content') {
    styleObj.height = 'fit-content';
  }
  
  // 宽度处理
  if (props.widthSizing && props.widthSizing !== 'fixed') {
    // handled above
  } else if (props.widthMode === 'auto') {
    styleObj.width = 'auto';
    styleObj.minWidth = '20px';
  } else {
    styleObj.width = `${currentWidth.value}px`;
  }
  
  // 高度处理
  if (props.heightSizing && props.heightSizing !== 'fixed') {
    // handled above
  } else if (props.autoHeight) {
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
  cursor: move;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: none;
  transition: border-color 0.2s ease;
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
</style>
