<template>
  <div 
    class="multi-select"
    :class="{ selecting: selectionState.isSelecting }"
    @pointerdown.capture="handlePointerDown"
  >
    <!-- 框选框 -->
    <div 
      v-if="selectionState.isSelecting"
      class="selection-box"
      :style="selectionBoxStyle"
    />
    
    <!-- 预选提示 -->
    <div 
      v-if="selectionState.isSelecting && previewComponents.length > 0"
      class="selection-preview"
      :style="previewStyle"
    >
      {{ previewComponents.length }} 个组件
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, inject, onUnmounted } from 'vue'
import { usePageStore } from '../../stores/page'
import type { Comp } from '../comps/base'
import { usePointerHubStore } from '../../stores/pointerHub'
import { COORDINATE_HELPER_KEY } from '../../utils/coordinateHelper'

interface Props {
  components: Comp[]
}

const props = defineProps<Props>()
const pageStore = usePageStore()
const pointerHubStore = usePointerHubStore()
const coord = inject(COORDINATE_HELPER_KEY)

if (!coord) {
  throw new Error('MultiSelect must be used under CoordinateHelper provider')
}

const coordHelper = coord as NonNullable<typeof coord>

// 框选状态
const selectionState = reactive({
  isSelecting: false,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  canSelect: false
})

// 预选组件列表
const previewComponents = ref<Comp[]>([])

// 框选框样式
const selectionBoxStyle = computed(() => {
  if (!selectionState.isSelecting) return { display: 'none' }

  const left = Math.min(selectionState.startX, selectionState.currentX)
  const top = Math.min(selectionState.startY, selectionState.currentY)
  const width = Math.abs(selectionState.currentX - selectionState.startX)
  const height = Math.abs(selectionState.currentY - selectionState.startY)
  
  return {
    position: 'absolute' as const,
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    border: '1px dashed #1890ff',
    backgroundColor: 'rgba(24, 144, 255, 0.1)',
    pointerEvents: 'none' as const,
    zIndex: '1002'
  }
})

// 预选提示样式
const previewStyle = computed(() => {
  return {
    position: 'absolute' as const,
    left: `${selectionState.currentX + 10}px`,
    top: `${selectionState.currentY - 25}px`,
    padding: '2px 8px',
    backgroundColor: '#1890ff',
    color: 'white',
    fontSize: '12px',
    borderRadius: '4px',
    pointerEvents: 'none' as const,
    zIndex: '1003'
  }
})

let unsubscribePointer: (() => void) | null = null
let activePointerId: number | null = null

function detachPointer() {
  if (unsubscribePointer) {
    unsubscribePointer()
    unsubscribePointer = null
  }
}

// 处理舞台指针按下（捕获阶段，用于阻止 Board 的空白点击逻辑）
function handlePointerDown(e: PointerEvent) {
  if (e.button !== 0) return

  const target = e.target as HTMLElement | null
  const isEmptyArea =
    !!target &&
    (target.classList.contains('multi-select') ||
      target.classList.contains('canvas-content') ||
      target.classList.contains('canvas') ||
      target.classList.contains('placeholder'))

  if (!isEmptyArea) return

  e.preventDefault()
  e.stopPropagation()
  startSelection(e)
}

// 开始框选（坐标统一使用 canvas 坐标系）
function startSelection(e: PointerEvent) {
  activePointerId = e.pointerId
  const startCanvas = coordHelper.clientToCanvas({ x: e.clientX, y: e.clientY })

  selectionState.isSelecting = true
  selectionState.startX = startCanvas.x
  selectionState.startY = startCanvas.y
  selectionState.currentX = selectionState.startX
  selectionState.currentY = selectionState.startY
  
  // 如果不是多选模式（Ctrl/Cmd），清空当前选中
  if (!e.ctrlKey && !e.metaKey) {
    pageStore.selectComponent(null)
  }
  
  detachPointer()
  unsubscribePointer = pointerHubStore.subscribe((msg) => {
    if (!selectionState.isSelecting) return
    if (activePointerId != null && msg.raw.pointerId !== activePointerId) return
    if (msg.type === 'move') {
      selectionState.currentX = msg.pos.canvas.x
      selectionState.currentY = msg.pos.canvas.y
      updatePreviewComponents()
      return
    }
    if (msg.type === 'up' || msg.type === 'cancel') {
      endSelection()
    }
  })
}

// 结束框选
function endSelection() {
  if (!selectionState.isSelecting) return
  
  detachPointer()
  activePointerId = null
  
  // 应用最终选中结果
  applySelection()
  
  // 重置状态
  selectionState.isSelecting = false
  previewComponents.value = []
}

// 更新预选组件
function updatePreviewComponents() {
  const selectionRect = getSelectionRect()
  if (!selectionRect) {
    previewComponents.value = []
    return
  }
  
  previewComponents.value = props.components.filter(comp => 
    isComponentInSelection(comp, selectionRect)
  )
}

// 应用选中结果
function applySelection() {
  const selectionRect = getSelectionRect()
  if (!selectionRect) return
  
  const selectedComponents = props.components.filter(comp => 
    isComponentInSelection(comp, selectionRect)
  )
  
  if (selectedComponents.length > 0) {
    // 直接操作 store
    const selectedIds = selectedComponents.map(comp => comp.id)
    pageStore.selectComponents(selectedIds)
  }
}

// 获取框选矩形（画布坐标系）
function getSelectionRect() {
  if (!selectionState.isSelecting) return null

  return {
    left: Math.min(selectionState.startX, selectionState.currentX),
    top: Math.min(selectionState.startY, selectionState.currentY),
    right: Math.max(selectionState.startX, selectionState.currentX),
    bottom: Math.max(selectionState.startY, selectionState.currentY)
  }
}

// 碰撞检测：检查组件是否在框选区域内
function isComponentInSelection(comp: Comp, selectionRect: any): boolean {
  const compLeft = comp.props.x || 0
  const compTop = comp.props.y || 0
  const compRight = compLeft + (comp.props.width || 100)
  const compBottom = compTop + (comp.props.height || 100)
  
  // 检查矩形相交（包含或部分重叠）
  return !(compRight < selectionRect.left || 
           compLeft > selectionRect.right || 
           compBottom < selectionRect.top || 
           compTop > selectionRect.bottom)
}

// 组件卸载时的清理
onUnmounted(() => {
  detachPointer()
})
</script>

<style scoped>
.multi-select {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: 1;
}

.selection-box {
  border: 1px dashed #1890ff;
  background-color: rgba(24, 144, 255, 0.1);
  pointer-events: none;
  z-index: 1002;
}

.selection-preview {
  font-size: 12px;
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
  z-index: 1003;
}
</style>