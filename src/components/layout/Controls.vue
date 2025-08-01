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
import { HandleDir } from '../../stores/control'

// 手柄尺寸常量配置
const HANDLE_CONFIG = {
  SIZE: 8,           // 手柄尺寸 (px)
  BORDER_WIDTH: 2,   // 边框宽度 (px)
  get HALF_SIZE() {  // 计算属性：手柄尺寸的一半，用于定位
    return this.SIZE / 2
  }
} as const

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
    position: 'absolute' as const,
    left: `${control.x - 1}px`,
    top: `${control.y - 1}px`,
    width: `${control.width + 2}px`,
    height: `${control.height + 2}px`,
    border: '1px solid #1890ff',
    pointerEvents: 'none' as const,
    zIndex: '1000'
  }
}

// 调整手柄样式
function getResizeHandleStyle(control: any) {
  const baseStyle = {
    position: 'absolute' as const,
    width: `${HANDLE_CONFIG.SIZE}px`,
    height: `${HANDLE_CONFIG.SIZE}px`,
    background: '#fff',
    border: `${HANDLE_CONFIG.BORDER_WIDTH}px solid #1890ff`,
    borderRadius: '50%',
    zIndex: '1001',
    cursor: getResizeCursor(control.handle)
  }
  
  // 根据handle类型计算位置
  const { x, y, width, height } = control
  let left = 0, top = 0
  
  switch (control.handle) {
    case HandleDir.TOP_LEFT:
      left = x - HANDLE_CONFIG.HALF_SIZE
      top = y - HANDLE_CONFIG.HALF_SIZE
      break
    case HandleDir.TOP_RIGHT:
      left = x + width - HANDLE_CONFIG.HALF_SIZE
      top = y - HANDLE_CONFIG.HALF_SIZE
      break
    case HandleDir.BOTTOM_LEFT:
      left = x - HANDLE_CONFIG.HALF_SIZE
      top = y + height - HANDLE_CONFIG.HALF_SIZE
      break
    case HandleDir.BOTTOM_RIGHT:
      left = x + width - HANDLE_CONFIG.HALF_SIZE
      top = y + height - HANDLE_CONFIG.HALF_SIZE
      break
    // 新增：右侧手柄
    case HandleDir.RIGHT:
      left = x + width - HANDLE_CONFIG.HALF_SIZE
      top = y + height / 2 - HANDLE_CONFIG.HALF_SIZE
      break
    // 新增：底部手柄
    case HandleDir.BOTTOM:
      left = x + width / 2 - HANDLE_CONFIG.HALF_SIZE
      top = y + height - HANDLE_CONFIG.HALF_SIZE
      break
  }
  
  return {
    ...baseStyle,
    left: `${left}px`,
    top: `${top}px`
  }
}

// 获取调整手柄的鼠标样式
function getResizeCursor(handle: HandleDir) {
  const cursorMap: Record<HandleDir, string> = {
    [HandleDir.TOP_LEFT]: 'nw-resize',
    [HandleDir.TOP_RIGHT]: 'ne-resize',
    [HandleDir.BOTTOM_LEFT]: 'sw-resize',
    [HandleDir.BOTTOM_RIGHT]: 'se-resize',
    [HandleDir.RIGHT]: 'e-resize',
    [HandleDir.BOTTOM]: 's-resize',
    [HandleDir.LEFT]: 'w-resize',
    [HandleDir.TOP]: 'n-resize'
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
}

.resize-handle {
  pointer-events: auto;
}

.resize-handle:hover {
  background: #1890ff !important;
  transform: scale(1.2);
}
</style>