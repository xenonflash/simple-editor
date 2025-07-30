import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Comp } from '../components/comps/base'

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
  
  // 画布尺寸
  const canvasWidth = 800
  const canvasHeight = 600
  
  // 计算吸附线
  const snapLines = computed<SnapLine[]>(() => {
    console.log('Computing snap lines:', {
      draggingComponent: draggingComponent.value,
      allComponentsCount: allComponents.value.length
    })
    
    if (!draggingComponent.value) {
      console.log('No dragging component, returning empty lines')
      return []
    }
    
    const lines: SnapLine[] = []
    const dragging = draggingComponent.value
    
    console.log('Dragging component:', dragging)
    
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
        const compPoints = {
          left: comp.props.x || 0,
          right: (comp.props.x || 0) + (comp.props.width || 100),
          centerX: (comp.props.x || 0) + (comp.props.width || 100) / 2,
          top: comp.props.y || 0,
          bottom: (comp.props.y || 0) + (comp.props.height || 100),
          centerY: (comp.props.y || 0) + (comp.props.height || 100) / 2
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
    const canvasLines = [
      // 垂直边界线
      { key: 'left', value: 0, range: [0, canvasHeight] },
      { key: 'right', value: canvasWidth, range: [0, canvasHeight] },
      { key: 'centerX', value: canvasWidth / 2, range: [0, canvasHeight] },
      // 水平边界线
      { key: 'top', value: 0, range: [0, canvasWidth] },
      { key: 'bottom', value: canvasHeight, range: [0, canvasWidth] },
      { key: 'centerY', value: canvasHeight / 2, range: [0, canvasWidth] }
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
    
    console.log('Generated snap lines:', lines)
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
      
      const compPoints = {
        left: comp.props.x || 0,
        right: (comp.props.x || 0) + (comp.props.width || 100),
        centerX: (comp.props.x || 0) + (comp.props.width || 100) / 2,
        top: comp.props.y || 0,
        bottom: (comp.props.y || 0) + (comp.props.height || 100),
        centerY: (comp.props.y || 0) + (comp.props.height || 100) / 2
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
    if (!hasSnappedX) {
      // 左边界
      if (Math.abs(dragPoints.left - 0) <= threshold) {
        snappedX = 0
        hasSnappedX = true
      }
      // 右边界
      else if (Math.abs(dragPoints.right - canvasWidth) <= threshold) {
        snappedX = canvasWidth - width
        hasSnappedX = true
      }
      // 水平中心线
      else if (Math.abs(dragPoints.centerX - canvasWidth / 2) <= threshold) {
        snappedX = canvasWidth / 2 - width / 2
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
      else if (Math.abs(dragPoints.bottom - canvasHeight) <= threshold) {
        snappedY = canvasHeight - height
        hasSnappedY = true
      }
      // 垂直中心线
      else if (Math.abs(dragPoints.centerY - canvasHeight / 2) <= threshold) {
        snappedY = canvasHeight / 2 - height / 2
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
  
  return {
    draggingComponent,
    allComponents,
    snapLines,
    calculateSnapPosition, // 新增
    updateDraggingComponent,
    updateAllComponents
  }
})