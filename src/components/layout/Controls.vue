<template>
  <div class="controls">
    <!-- 选中边框 -->
    <div 
      v-for="control in selectionControls" 
      :key="control.id"
      class="selection-border"
      :style="getSelectionStyle(control)"
    />
    
    <!-- 调整手柄 -->
    <div 
      v-for="control in resizeControls" 
      :key="control.id"
      class="resize-handle"
      :class="control.handle"
      :style="getResizeHandleStyle(control)"
      @mousedown.stop="handleResizeStart(control, $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useControlStore } from '../../stores/control'
import { useResizable } from '../../utils/dragHelper'
import { usePageStore } from '../../stores/page'

interface Props {
  scale: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: [componentId: string, updates: any]
}>()

const controlStore = useControlStore()
const pageStore = usePageStore()

// 分离选中边框和调整手柄
const selectionControls = computed(() => 
  controlStore.controls.filter(c => c.type === 'selection')
)

const resizeControls = computed(() => 
  controlStore.controls.filter(c => c.type === 'resize')
)

// 选中边框样式
function getSelectionStyle(control: any) {
  return {
    position: 'absolute',
    left: `${control.x - 1}px`,
    top: `${control.y - 1}px`,
    width: `${control.width + 2}px`,
    height: `${control.height + 2}px`,
    border: '1px solid #1890ff',
    pointerEvents: 'none',
    zIndex: '1000'
  }
}

// 调整手柄样式
function getResizeHandleStyle(control: any) {
  const baseStyle = {
    position: 'absolute',
    width: '12px',
    height: '12px',
    background: '#fff',
    border: '2px solid #1890ff',
    borderRadius: '50%',
    zIndex: '1001',
    cursor: getResizeCursor(control.handle)
  }
  
  // 根据handle类型计算位置
  const { x, y, width, height } = control
  let left = 0, top = 0
  
  switch (control.handle) {
    case 'top-left':
      left = x - 6
      top = y - 6
      break
    case 'top-right':
      left = x + width - 6
      top = y - 6
      break
    case 'bottom-left':
      left = x - 6
      top = y + height - 6
      break
    case 'bottom-right':
      left = x + width - 6
      top = y + height - 6
      break
  }
  
  return {
    ...baseStyle,
    left: `${left}px`,
    top: `${top}px`
  }
}

// 获取调整手柄的鼠标样式
function getResizeCursor(handle: string) {
  const cursorMap: Record<string, string> = {
    'top-left': 'nw-resize',
    'top-right': 'ne-resize',
    'bottom-left': 'sw-resize',
    'bottom-right': 'se-resize'
  }
  return cursorMap[handle] || 'default'
}

// 调整大小功能
const { startResize } = useResizable({
  scale: computed(() => props.scale),
  onUpdate: (updates) => {
    // 通过emit向Board组件传递更新事件
    const selectedComp = pageStore.selectedComps[0]
    if (selectedComp) {
      emit('update', selectedComp.id, updates)
    }
  }
})

// 处理调整大小开始
function handleResizeStart(control: any, e: MouseEvent) {
  const selectedComp = pageStore.selectedComps[0]
  if (!selectedComp) return
  
  startResize(control.handle, e, {
    x: control.x,
    y: control.y,
    width: control.width,
    height: control.height
  })
}
</script>

<style scoped>
.controls {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999;
}

.selection-border {
  box-shadow: 0 0 0 0.5px rgba(255, 255, 255, 0.8);
  animation: selectionFadeIn 0.2s ease-out;
}

.resize-handle {
  pointer-events: auto;
  transition: transform 0.2s ease;
}

.resize-handle:hover {
  background: #1890ff !important;
  transform: scale(1.2);
}

@keyframes selectionFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>