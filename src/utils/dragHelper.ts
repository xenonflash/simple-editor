import { ref } from 'vue'
import type { Ref } from 'vue'
import type { CompProps } from '../components/comps/base'
import { useSnaplineStore } from '../stores/snapline'
// 新增：导入 usePageStore
import { usePageStore } from '../stores/page'
import { HandleDir } from '@/stores/control'

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

// 在 useDraggable 函数中添加群组拖拽支持
export function useDraggable(options: DragOptions = {}) {
  const dragState = ref<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0
  })
  
  const snaplineStore = useSnaplineStore()
  // 新增：导入 pageStore
  const pageStore = usePageStore()

  // 重要：必须用稳定的函数引用绑定/解绑 window 事件，否则多次拖动会累积监听器导致重复更新和运行时异常
  let groupStartPositions: Map<string, { x: number; y: number }> | null = null

  function onWindowMouseMove(e: MouseEvent) {
    handleMouseMove(e, groupStartPositions || undefined)
  }

  function handleMouseDown(e: MouseEvent, currentX: number, currentY: number) {
    if (dragState.value.isDragging) return

    dragState.value.isDragging = true
    dragState.value.startX = e.clientX
    dragState.value.startY = e.clientY
    dragState.value.startPosX = currentX
    dragState.value.startPosY = currentY

    // 新增：记录群组拖拽的初始位置
    const selectedComponents = pageStore.selectedComps
    if (selectedComponents.length > 1 && options.componentId) {
      const map = new Map<string, { x: number; y: number }>()
      // 多选状态下，记录所有选中组件的初始位置
      selectedComponents.forEach(comp => {
        map.set(comp.id, {
          x: comp.props.x || 0,
          y: comp.props.y || 0
        })
      })
      groupStartPositions = map
    } else {
      groupStartPositions = null
    }

    window.addEventListener('mousemove', onWindowMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    options.onDragStart?.()
  }

  function handleMouseMove(e: MouseEvent, groupStartPositions?: Map<string, {x: number, y: number}>) {
    if (!dragState.value.isDragging) return

    const scale = (typeof options.scale === 'object' ? options.scale.value : options.scale) || 1
    const deltaX = (e.clientX - dragState.value.startX) / scale
    const deltaY = (e.clientY - dragState.value.startY) / scale

    const selectedComponents = pageStore.selectedComps
    
    // 检查是否为群组拖拽
    if (selectedComponents.length > 1 && groupStartPositions && options.componentId) {
      const isCurrentComponentSelected = selectedComponents.some(comp => comp.id === options.componentId)
      
      if (isCurrentComponentSelected) {
        // 群组拖拽：移动所有选中的组件
        selectedComponents.forEach(comp => {
          const startPos = groupStartPositions.get(comp.id)
          if (startPos) {
            const newX = startPos.x + deltaX
            const newY = startPos.y + deltaY
            
            // 触发每个组件的更新
            if (comp.id === options.componentId) {
              // 当前拖拽的组件通过 onUpdate 回调更新
              options.onUpdate?.({
                x: newX,
                y: newY
              })
            } else {
              // 其他选中组件直接更新
              pageStore.updateComponentPosition(comp.id, { x: newX, y: newY })
            }
          }
        })
        return
      }
    }
    
    // 单个组件拖拽（原有逻辑）
    const rawX = dragState.value.startPosX + deltaX
    const rawY = dragState.value.startPosY + deltaY

    let finalX = rawX
    let finalY = rawY

    // 吸附计算逻辑保持不变...
    if (options.componentId && options.componentSize) {
      const size = typeof options.componentSize === 'object' && 'value' in options.componentSize 
        ? options.componentSize.value 
        : options.componentSize
      
      snaplineStore.updateDraggingComponent({
        id: options.componentId,
        x: rawX,
        y: rawY,
        width: size.width,
        height: size.height
      })
      
      const snapResult = snaplineStore.calculateSnapPosition(rawX, rawY, size.width, size.height)
      finalX = snapResult.x
      finalY = snapResult.y
      
      snaplineStore.updateDraggingComponent({
        id: options.componentId,
        x: finalX,
        y: finalY,
        width: size.width,
        height: size.height
      })
    }

    options.onUpdate?.({
      x: finalX,
      y: finalY
    })
  }

  // handleMouseUp 保持不变...
  function handleMouseUp() {
    if (dragState.value.isDragging) {
      dragState.value.isDragging = false
      window.removeEventListener('mousemove', onWindowMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)

      groupStartPositions = null
      
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
    const minWidth = options.minWidth || 1
    const minHeight = options.minHeight || 1

    const updates: Partial<CompProps> = {}

    switch (resizeState.value.handle) {
      case HandleDir.TOP_LEFT:
        const newWidthTL = Math.max(minWidth, resizeState.value.startWidth - deltaX)
        const newHeightTL = Math.max(minHeight, resizeState.value.startHeight - deltaY)
        updates.width = newWidthTL
        updates.height = newHeightTL
        updates.x = resizeState.value.startPosX + resizeState.value.startWidth - newWidthTL
        updates.y = resizeState.value.startPosY + resizeState.value.startHeight - newHeightTL
        break
      case HandleDir.TOP_RIGHT:
        updates.width = Math.max(minWidth, resizeState.value.startWidth + deltaX)
        updates.height = Math.max(minHeight, resizeState.value.startHeight - deltaY)
        updates.y = resizeState.value.startPosY + resizeState.value.startHeight - updates.height
        break
      case HandleDir.BOTTOM_LEFT:
        updates.width = Math.max(minWidth, resizeState.value.startWidth - deltaX)
        updates.height = Math.max(minHeight, resizeState.value.startHeight + deltaY)
        updates.x = resizeState.value.startPosX + resizeState.value.startWidth - updates.width
        break
      case HandleDir.BOTTOM_RIGHT:
        updates.width = Math.max(minWidth, resizeState.value.startWidth + deltaX)
        updates.height = Math.max(minHeight, resizeState.value.startHeight + deltaY)
        break
      // 新增：右侧手柄 - 只调整宽度
      case HandleDir.RIGHT:
        updates.width = Math.max(minWidth, resizeState.value.startWidth + deltaX)
        break
      // 新增：底部手柄 - 只调整高度
      case HandleDir.BOTTOM:
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