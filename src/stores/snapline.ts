import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Comp } from '../components/comps/base'
import { usePageStore } from './page'

export interface SnapLine {
  id: string
  type: 'horizontal' | 'vertical'
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface SnapResult {
  x: number
  y: number
  snappedX: boolean
  snappedY: boolean
}

export const useSnaplineStore = defineStore('snapline', () => {
  const pageStore = usePageStore()

  function getCompCanvasRect(compId: string, fallbackProps: any): { x: number; y: number; width: number; height: number } {
    const comp = pageStore.getComponentById(compId)
    const p: any = comp?.props ?? fallbackProps ?? {}

    const pos = pageStore.getComponentCanvasPosition(compId)
    const x = pos?.x ?? (Number(p?.x) || 0)
    const y = pos?.y ?? (Number(p?.y) || 0)

    const measuredW = Number(p?._measuredWidth)
    const measuredH = Number(p?._measuredHeight)

    const rawW = typeof p?.width === 'number' ? p.width : Number(p?.width)
    const rawH = typeof p?.height === 'number' ? p.height : Number(p?.height)

    const width = Number.isFinite(rawW) ? rawW : (Number.isFinite(measuredW) ? measuredW : 100)
    const height = Number.isFinite(rawH) ? rawH : (Number.isFinite(measuredH) ? measuredH : 100)

    return { x, y, width, height }
  }

  // 当前拖拽的组件信息
  const draggingComponent = ref<{
    id: string
    x: number
    y: number
    width: number
    height: number
  } | null>(null)
  
  // 所有组件信息
  const allComponents = ref<Comp[]>([])
  
  // 吸附阈值
  const threshold = 5
  
  // 画布尺寸（由 Board 同步，避免硬编码）
  const canvasWidth = ref(800)
  const canvasHeight = ref(600)
  
  // 计算吸附线
  const snapLines = computed<SnapLine[]>(() => {
    if (!draggingComponent.value) {
      return []
    }
    
    const lines: SnapLine[] = []
    const dragging = draggingComponent.value
    
    // 拖拽组件的关键点
    const dragPoints = {
      left: dragging.x,
      right: dragging.x + dragging.width,
      centerX: dragging.x + dragging.width / 2,
      top: dragging.y,
      bottom: dragging.y + dragging.height,
      centerY: dragging.y + dragging.height / 2
    }
    
    // 与其他组件对齐
    allComponents.value
      .filter(comp => comp.id !== dragging.id)
      .forEach(comp => {
        const rect = getCompCanvasRect(comp.id, comp.props)
        const compPoints = {
          left: rect.x,
          right: rect.x + rect.width,
          centerX: rect.x + rect.width / 2,
          top: rect.y,
          bottom: rect.y + rect.height,
          centerY: rect.y + rect.height / 2
        }
        
        // 垂直对齐线
        Object.entries(compPoints).forEach(([key, value]) => {
          if (['left', 'right', 'centerX'].includes(key)) {
            const dragValue = dragPoints[key as keyof typeof dragPoints]
            if (Math.abs(dragValue - value) <= threshold) {
              lines.push({
                id: `v-${comp.id}-${key}`,
                type: 'vertical',
                x1: value,
                y1: Math.min(dragPoints.top, compPoints.top) - 20,
                x2: value,
                y2: Math.max(dragPoints.bottom, compPoints.bottom) + 20
              })
            }
          }
        })
        
        // 水平对齐线
        Object.entries(compPoints).forEach(([key, value]) => {
          if (['top', 'bottom', 'centerY'].includes(key)) {
            const dragValue = dragPoints[key as keyof typeof dragPoints]
            if (Math.abs(dragValue - value) <= threshold) {
              lines.push({
                id: `h-${comp.id}-${key}`,
                type: 'horizontal',
                x1: Math.min(dragPoints.left, compPoints.left) - 20,
                y1: value,
                x2: Math.max(dragPoints.right, compPoints.right) + 20,
                y2: value
              })
            }
          }
        })
      })
    
    // 与画布边界对齐
    const w = canvasWidth.value
    const h = canvasHeight.value
    const canvasLines = [
      // 垂直边界线
      { key: 'left', value: 0, range: [0, h] },
      { key: 'right', value: w, range: [0, h] },
      { key: 'centerX', value: w / 2, range: [0, h] },
      // 水平边界线
      { key: 'top', value: 0, range: [0, w] },
      { key: 'bottom', value: h, range: [0, w] },
      { key: 'centerY', value: h / 2, range: [0, w] }
    ]
    
    canvasLines.forEach(({ key, value, range }) => {
      const dragValue = dragPoints[key as keyof typeof dragPoints]
      if (Math.abs(dragValue - value) <= threshold) {
        if (['left', 'right', 'centerX'].includes(key)) {
          lines.push({
            id: `canvas-v-${key}`,
            type: 'vertical',
            x1: value,
            y1: range[0],
            x2: value,
            y2: range[1]
          })
        } else {
          lines.push({
            id: `canvas-h-${key}`,
            type: 'horizontal',
            x1: range[0],
            y1: value,
            x2: range[1],
            y2: value
          })
        }
      }
    })
    
    return lines
  })
  
  // 新增：计算吸附位置
  const calculateSnapPosition = (x: number, y: number, width: number, height: number): SnapResult => {
    let snappedX = x
    let snappedY = y
    let hasSnappedX = false
    let hasSnappedY = false
    
    // 当前组件的关键点
    const dragPoints = {
      left: x,
      right: x + width,
      centerX: x + width / 2,
      top: y,
      bottom: y + height,
      centerY: y + height / 2
    }
    
    // 检查与其他组件的吸附
    for (const comp of allComponents.value) {
      if (draggingComponent.value && comp.id === draggingComponent.value.id) continue

      const rect = getCompCanvasRect(comp.id, comp.props)
      const compPoints = {
        left: rect.x,
        right: rect.x + rect.width,
        centerX: rect.x + rect.width / 2,
        top: rect.y,
        bottom: rect.y + rect.height,
        centerY: rect.y + rect.height / 2
      }
      
      // 检查垂直吸附（X轴）
      if (!hasSnappedX) {
        for (const [dragKey, dragValue] of Object.entries(dragPoints)) {
          if (!['left', 'right', 'centerX'].includes(dragKey)) continue
          
          for (const [compKey, compValue] of Object.entries(compPoints)) {
            if (!['left', 'right', 'centerX'].includes(compKey)) continue
            
            if (Math.abs(dragValue - compValue) <= threshold) {
              // 计算吸附后的X位置
              const offset = dragValue - x
              snappedX = compValue - offset
              hasSnappedX = true
              break
            }
          }
          if (hasSnappedX) break
        }
      }
      
      // 检查水平吸附（Y轴）
      if (!hasSnappedY) {
        for (const [dragKey, dragValue] of Object.entries(dragPoints)) {
          if (!['top', 'bottom', 'centerY'].includes(dragKey)) continue
          
          for (const [compKey, compValue] of Object.entries(compPoints)) {
            if (!['top', 'bottom', 'centerY'].includes(compKey)) continue
            
            if (Math.abs(dragValue - compValue) <= threshold) {
              // 计算吸附后的Y位置
              const offset = dragValue - y
              snappedY = compValue - offset
              hasSnappedY = true
              break
            }
          }
          if (hasSnappedY) break
        }
      }
    }
    
    // 检查与画布边界的吸附
    const w = canvasWidth.value
    const h = canvasHeight.value
    if (!hasSnappedX) {
      // 左边界
      if (Math.abs(dragPoints.left - 0) <= threshold) {
        snappedX = 0
        hasSnappedX = true
      }
      // 右边界
      else if (Math.abs(dragPoints.right - w) <= threshold) {
        snappedX = w - width
        hasSnappedX = true
      }
      // 水平中心线
      else if (Math.abs(dragPoints.centerX - w / 2) <= threshold) {
        snappedX = w / 2 - width / 2
        hasSnappedX = true
      }
    }
    
    if (!hasSnappedY) {
      // 上边界
      if (Math.abs(dragPoints.top - 0) <= threshold) {
        snappedY = 0
        hasSnappedY = true
      }
      // 下边界
      else if (Math.abs(dragPoints.bottom - h) <= threshold) {
        snappedY = h - height
        hasSnappedY = true
      }
      // 垂直中心线
      else if (Math.abs(dragPoints.centerY - h / 2) <= threshold) {
        snappedY = h / 2 - height / 2
        hasSnappedY = true
      }
    }
    
    return {
      x: snappedX,
      y: snappedY,
      snappedX: hasSnappedX,
      snappedY: hasSnappedY
    }
  }
  
  // 更新拖拽组件信息
  const updateDraggingComponent = (component: {
    id: string
    x: number
    y: number
    width: number
    height: number
  } | null) => {
    draggingComponent.value = component
  }
  
  // 更新所有组件信息
  const updateAllComponents = (components: Comp[]) => {
    allComponents.value = components
  }

  const updateCanvasSize = (size: { width: number; height: number }) => {
    const width = Number.isFinite(size.width) ? Math.max(1, size.width) : 800
    const height = Number.isFinite(size.height) ? Math.max(1, size.height) : 600
    canvasWidth.value = width
    canvasHeight.value = height
  }
  
  return {
    draggingComponent,
    allComponents,
    canvasWidth,
    canvasHeight,
    snapLines,
    calculateSnapPosition, // 新增
    updateDraggingComponent,
    updateAllComponents,
    updateCanvasSize
  }
})