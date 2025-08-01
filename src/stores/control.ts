import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Comp } from '../components/comps/base'
import { usePageStore } from './page'

export interface ControlPoint {
  id: string
  type: 'selection' | 'resize'
  componentId: string
  x: number
  y: number
  width: number
  height: number
  handle?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'right' | 'bottom' | 'left'
}

export const useControlStore = defineStore('control', () => {
  const pageStore = usePageStore()
  
  // 计算控制点数组
  const controls = computed<ControlPoint[]>(() => {
    const selectedComps = pageStore.selectedComps
    if (selectedComps.length === 0) return []
    
    const controlPoints: ControlPoint[] = []
    
    selectedComps.forEach(comp => {
      const x = comp.props.x || 0
      const y = comp.props.y || 0
      const width = comp.props.width || 100
      const height = comp.props.height || 100
      
      // 选中边框
      controlPoints.push({
        id: `selection-${comp.id}`,
        type: 'selection',
        componentId: comp.id,
        x,
        y,
        width,
        height
      })
      
      // 调整手柄（仅单选时显示）
      if (selectedComps.length === 1) {
        const handles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const
        handles.forEach(handle => {
          controlPoints.push({
            id: `resize-${comp.id}-${handle}`,
            type: 'resize',
            componentId: comp.id,
            x,
            y,
            width,
            height,
            handle
          })
        })
      }
    })
    
    return controlPoints
  })
  
  return {
    controls
  }
})