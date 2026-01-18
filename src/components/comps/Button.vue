<template>
    <button class="button-comp" 
      :data-comp-id="props.id"
          ref="buttonRef"
          :style="buttonStyle" 
          @mousedown.stop="handleMouseDown"
          @click.stop>
    {{ props.content || '按钮' }}
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CompProps } from './base'
import { useDraggable } from '../../utils/dragHelper'
import { usePageStore } from '../../stores/page'
import { useMeasuredSize } from '../../utils/useMeasuredSize'

const props = defineProps<{
  id: string;
  content?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  widthSizing?: 'fixed' | 'fill' | 'content';
  heightSizing?: 'fixed' | 'fill' | 'content';
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
  inFlowLayout?: boolean;
  locked?: boolean;
  bindingContext?: any;
}>();

const emit = defineEmits<{
  (e: 'update', updates: Partial<CompProps>): void
}>()

const pageStore = usePageStore()

const buttonRef = ref<HTMLElement | null>(null)

useMeasuredSize({ 
  elementRef: buttonRef, 
  componentId: props.id,
  bindingContext: props.bindingContext
})

// 计算组件尺寸
const componentSize = computed(() => {
  const width = props.width || 100
  const height = props.height || 32
  return { width, height }
})

// 使用拖拽功能
const { handleMouseDown: startDrag } = useDraggable({
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
  onUpdate: (updates) => emit('update', updates)
});

// 处理鼠标按下事件
function handleMouseDown(e: MouseEvent) {
  if (props.locked) {
    const multiSelect = e.ctrlKey || e.metaKey;
    if (!pageStore.isComponentSelected(props.id)) {
      pageStore.selectComponent(props.id, multiSelect);
    } else if (multiSelect) {
      pageStore.selectComponent(props.id, true);
    }
    return;
  }

  if (props.inFlowLayout) {
    const multiSelect = e.ctrlKey || e.metaKey;
    if (!pageStore.isComponentSelected(props.id)) {
      pageStore.selectComponent(props.id, multiSelect);
    } else if (multiSelect) {
      pageStore.selectComponent(props.id, true);
    }
    return;
  }
  startDrag(e, props.x, props.y);
}

// 计算按钮样式
const buttonStyle = computed(() => {
  return {
    position: props.inFlowLayout ? 'relative' : 'absolute',
    transform: props.inFlowLayout ? 'none' : `translate(${props.x}px, ${props.y}px)`,
    width: props.widthSizing === 'fill'
      ? '100%'
      : props.widthSizing === 'content'
        ? 'fit-content'
        : `${props.width || 100}px`,
    height: props.heightSizing === 'fill'
      ? '100%'
      : props.heightSizing === 'content'
        ? 'fit-content'
        : `${props.height || 32}px`,
    cursor: props.inFlowLayout ? 'default' : 'move',
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
  } as any;
});
</script>

<style scoped>
.button-comp {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 15px;
  cursor: move;
  user-select: none;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
}
</style>
