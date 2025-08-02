<template>
  <div 
    class="multi-select"
    :class="{ selecting: selectionState.isSelecting }"
    @mousedown="handleMouseDown"
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
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { usePageStore } from '../../stores/page'
import type { Comp } from '../comps/base'

interface Props {
  components: Comp[]
  scale: number
  offset: { x: number; y: number }
  canvasRef?: HTMLElement | null
}

const props = defineProps<Props>()
const pageStore = usePageStore()

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

// 修正：canvas相对坐标转画布坐标
function canvasToWorld(canvasX: number, canvasY: number) {
  return {
    x: canvasX / props.scale,
    y: canvasY / props.scale
  }
}

// 框选框样式
const selectionBoxStyle = computed(() => {
  if (!selectionState.isSelecting) return { display: 'none' }
  
  // 转换为画布坐标系
  const startCanvas = canvasToWorld(selectionState.startX, selectionState.startY)
  const endCanvas = canvasToWorld(selectionState.currentX, selectionState.currentY)
  
  const left = Math.min(startCanvas.x, endCanvas.x)
  const top = Math.min(startCanvas.y, endCanvas.y)
  const width = Math.abs(endCanvas.x - startCanvas.x)
  const height = Math.abs(endCanvas.y - startCanvas.y)
  
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
  // 转换为画布坐标系
  const canvasPos = canvasToWorld(selectionState.currentX, selectionState.currentY)
  
  return {
    position: 'absolute' as const,
    left: `${canvasPos.x + 10}px`,
    top: `${canvasPos.y - 25}px`,
    padding: '2px 8px',
    backgroundColor: '#1890ff',
    color: 'white',
    fontSize: '12px',
    borderRadius: '4px',
    pointerEvents: 'none' as const,
    zIndex: '1003'
  }
})

// 处理鼠标按下
function handleMouseDown(e: MouseEvent) {
  // 只处理左键点击
  if (e.button !== 0) return
  
  const target = e.target as HTMLElement
  
  // 只有点击在这些空白元素上才开始框选
  const isEmptyArea = target.classList.contains('multi-select') ||
                     target.classList.contains('canvas-content') ||
                     target.classList.contains('canvas') ||
                     target.classList.contains('placeholder')
  
  if (isEmptyArea) {
    e.preventDefault()
    e.stopPropagation()
    startSelection(e)
  }
}

// 开始框选
function startSelection(e: MouseEvent) {
  const rect = props.canvasRef?.getBoundingClientRect()
  if (!rect) return
  
  selectionState.isSelecting = true
  selectionState.startX = e.clientX - rect.left
  selectionState.startY = e.clientY - rect.top
  selectionState.currentX = selectionState.startX
  selectionState.currentY = selectionState.startY
  
  // 如果不是多选模式（Ctrl/Cmd），清空当前选中
  if (!e.ctrlKey && !e.metaKey) {
    pageStore.selectComponent(null)
  }
  
  // 添加全局事件监听
  window.addEventListener('mousemove', handleGlobalMouseMove)
  window.addEventListener('mouseup', handleGlobalMouseUp)
}

// 全局鼠标移动处理
function handleGlobalMouseMove(e: MouseEvent) {
  if (!selectionState.isSelecting) return
  updateSelection(e)
}

// 更新框选状态
function updateSelection(e: MouseEvent) {
  const rect = props.canvasRef?.getBoundingClientRect()
  if (!rect) return
  
  selectionState.currentX = e.clientX - rect.left
  selectionState.currentY = e.clientY - rect.top
  
  // 实时更新预选组件
  updatePreviewComponents()
}

// 全局鼠标释放处理
function handleGlobalMouseUp(e: MouseEvent) {
  endSelection()
}

// 结束框选
function endSelection() {
  if (!selectionState.isSelecting) return
  
  // 移除全局事件监听
  window.removeEventListener('mousemove', handleGlobalMouseMove)
  window.removeEventListener('mouseup', handleGlobalMouseUp)
  
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
  
  // 转换为画布坐标系
  const startCanvas = canvasToWorld(selectionState.startX, selectionState.startY)
  const endCanvas = canvasToWorld(selectionState.currentX, selectionState.currentY)
  
  return {
    left: Math.min(startCanvas.x, endCanvas.x),
    top: Math.min(startCanvas.y, endCanvas.y),
    right: Math.max(startCanvas.x, endCanvas.x),
    bottom: Math.max(startCanvas.y, endCanvas.y)
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

// 组件挂载时的初始化
onMounted(() => {
  // 可以在这里添加额外的初始化逻辑
})

// 组件卸载时的清理
onUnmounted(() => {
  // 清理全局事件监听
  window.removeEventListener('mousemove', handleGlobalMouseMove)
  window.removeEventListener('mouseup', handleGlobalMouseUp)
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