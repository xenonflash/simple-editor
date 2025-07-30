import { ref } from 'vue'
import type { Ref } from 'vue'
import type { CompProps } from '../components/comps/base'
import { useSnaplineStore } from '../stores/snapline'

interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  startPosX: number
  startPosY: number
}

interface DragOptions {
  scale?: Ref<number> | number
  onDragStart?: () => void
  onDragEnd?: () => void
  onUpdate?: (updates: Partial<CompProps>) => void
  componentId?: string
  componentSize?: Ref<{ width: number; height: number }> | { width: number; height: number }
}

export function useDraggable(options: DragOptions = {}) {
  const dragState = ref<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0
  })
  
  const snaplineStore = useSnaplineStore()

  function handleMouseDown(e: MouseEvent, currentX: number, currentY: number) {
    dragState.value.isDragging = true
    dragState.value.startX = e.clientX
    dragState.value.startY = e.clientY
    dragState.value.startPosX = currentX
    dragState.value.startPosY = currentY

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    options.onDragStart?.()
  }

  function handleMouseMove(e: MouseEvent) {
    if (!dragState.value.isDragging) return

    const scale = (typeof options.scale === 'object' ? options.scale.value : options.scale) || 1
    const deltaX = (e.clientX - dragState.value.startX) / scale
    const deltaY = (e.clientY - dragState.value.startY) / scale

    const newX = dragState.value.startPosX + deltaX
    const newY = dragState.value.startPosY + deltaY

    // 更新拖拽组件信息到 store
    if (options.componentId && options.componentSize) {
      const size = typeof options.componentSize === 'object' && 'value' in options.componentSize 
        ? options.componentSize.value 
        : options.componentSize
      
      console.log('Updating dragging component:', {
        id: options.componentId,
        x: newX,
        y: newY,
        size
      })
      
      snaplineStore.updateDraggingComponent({
        id: options.componentId,
        x: newX,
        y: newY,
        width: size.width,
        height: size.height
      })
    }

    options.onUpdate?.({
      x: newX,
      y: newY
    })
  }

  function handleMouseUp() {
    if (dragState.value.isDragging) {
      dragState.value.isDragging = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      
      // 清除拖拽状态
      console.log('Clearing dragging component')
      snaplineStore.updateDraggingComponent(null)
      
      options.onDragEnd?.()
    }
  }

  return {
    dragState,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  }
}

// 添加useResizable函数
interface ResizeState {
  isResizing: boolean
  handle: string | null
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  startPosX: number
  startPosY: number
}

interface ResizeOptions {
  scale?: Ref<number> | number
  minWidth?: number
  minHeight?: number
  onResizeStart?: () => void
  onResizeEnd?: () => void
  onUpdate?: (updates: Partial<CompProps>) => void
}

export function useResizable(options: ResizeOptions = {}) {
  const resizeState = ref<ResizeState>({
    isResizing: false,
    handle: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startPosX: 0,
    startPosY: 0
  })

  function startResize(
    handle: string,
    e: MouseEvent,
    currentBounds: { x: number; y: number; width: number; height: number }
  ) {
    resizeState.value.isResizing = true
    resizeState.value.handle = handle
    resizeState.value.startX = e.clientX
    resizeState.value.startY = e.clientY
    resizeState.value.startWidth = currentBounds.width
    resizeState.value.startHeight = currentBounds.height
    resizeState.value.startPosX = currentBounds.x
    resizeState.value.startPosY = currentBounds.y

    window.addEventListener('mousemove', handleResize)
    window.addEventListener('mouseup', handleResizeEnd)
    options.onResizeStart?.()
  }

  function handleResize(e: MouseEvent) {
    if (!resizeState.value.isResizing) return

    const scale = (typeof options.scale === 'object' ? options.scale.value : options.scale) || 1
    const deltaX = (e.clientX - resizeState.value.startX) / scale
    const deltaY = (e.clientY - resizeState.value.startY) / scale
    const minWidth = options.minWidth || 50
    const minHeight = options.minHeight || 50

    const updates: Partial<CompProps> = {}

    switch (resizeState.value.handle) {
      case 'top-left':
        const newWidthTL = Math.max(minWidth, resizeState.value.startWidth - deltaX)
        const newHeightTL = Math.max(minHeight, resizeState.value.startHeight - deltaY)
        updates.width = newWidthTL
        updates.height = newHeightTL
        updates.x = resizeState.value.startPosX + resizeState.value.startWidth - newWidthTL
        updates.y = resizeState.value.startPosY + resizeState.value.startHeight - newHeightTL
        break
      case 'top-right':
        updates.width = Math.max(minWidth, resizeState.value.startWidth + deltaX)
        updates.height = Math.max(minHeight, resizeState.value.startHeight - deltaY)
        updates.y = resizeState.value.startPosY + resizeState.value.startHeight - updates.height
        break
      case 'bottom-left':
        updates.width = Math.max(minWidth, resizeState.value.startWidth - deltaX)
        updates.height = Math.max(minHeight, resizeState.value.startHeight + deltaY)
        updates.x = resizeState.value.startPosX + resizeState.value.startWidth - updates.width
        break
      case 'bottom-right':
        updates.width = Math.max(minWidth, resizeState.value.startWidth + deltaX)
        updates.height = Math.max(minHeight, resizeState.value.startHeight + deltaY)
        break
    }

    options.onUpdate?.(updates)
  }

  function handleResizeEnd() {
    if (resizeState.value.isResizing) {
      resizeState.value.isResizing = false
      window.removeEventListener('mousemove', handleResize)
      window.removeEventListener('mouseup', handleResizeEnd)
      options.onResizeEnd?.()
    }
  }

  return {
    resizeState,
    startResize
  }
}