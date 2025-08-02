import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Comp } from '../components/comps/base'
import { usePageStore } from './page'
import { CompType } from '../components/comps/base'

export enum HandleDir {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
  TOP = 'top',
  RIGHT = 'right',
  BOTTOM = 'bottom',
  LEFT = 'left',
}

export interface ControlPoint {
  id: string
  type: 'selection' | 'resize'
  componentId: string
  x: number
  y: number
  width: number
  height: number
  handle?: HandleDir
}

// 计算文字实际宽度（复制Text组件的逻辑）
function calculateTextWidth(text: string, fontSize: number, fontWeight: string, fontFamily: string): number {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return 100
  
  context.font = `${fontWeight || 'normal'} ${fontSize || 14}px ${fontFamily || 'Arial'}`
  const metrics = context.measureText(text || '一段文字')
  const width = metrics.width + 8
  
  return Math.max(20, width)
}

// 计算文字实际高度（复制Text组件的逻辑）
function calculateTextHeight(text: string, width: number, fontSize: number, fontWeight: string, fontFamily: string): number {
  const tempDiv = document.createElement('div')
  tempDiv.style.cssText = `
    position: absolute;
    visibility: hidden;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: ${fontSize || 14}px;
    font-weight: ${fontWeight || 'normal'};
    font-family: ${fontFamily || 'Arial'};
    width: ${width}px;
  `
  tempDiv.textContent = text || '新建文本'
  document.body.appendChild(tempDiv)
  const height = tempDiv.offsetHeight
  document.body.removeChild(tempDiv)
  
  return Math.max(10, height)
}

// 获取组件的实际尺寸（考虑自动尺寸）
function getComponentActualSize(comp: Comp): { width: number; height: number } {
  let width = comp.props.width || 100
  let height = comp.props.height || 100
  
  // 处理Text组件的自动尺寸
  if (comp.type === CompType.TEXT) {
    // 自动宽度
    if (comp.props.widthMode === 'auto') {
      width = calculateTextWidth(
        comp.props.content || '新建文本',
        comp.props.fontSize || 14,
        comp.props.fontWeight || 'normal',
        comp.props.fontFamily || 'Arial'
      )
    }
    
    // 自动高度
    if (comp.props.autoHeight) {
      height = calculateTextHeight(
        comp.props.content || '新建文本',
        width,
        comp.props.fontSize || 14,
        comp.props.fontWeight || 'normal',
        comp.props.fontFamily || 'Arial'
      )
    }
  }
  
  return { width, height }
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
      
      // 获取实际尺寸（考虑自动尺寸）
      const { width, height } = getComponentActualSize(comp)
      
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
        let handles = [HandleDir.TOP_LEFT, HandleDir.TOP_RIGHT, HandleDir.BOTTOM_LEFT, HandleDir.BOTTOM_RIGHT]
        
        if (comp.type === CompType.TEXT) {
          const isAutoWidth = comp.props.widthMode === 'auto'
          const isAutoHeight = comp.props.autoHeight
          handles = [HandleDir.RIGHT, HandleDir.BOTTOM]
          
          // 如果宽度或高度任一为自动，则不显示调整手柄
          // 因为四角手柄会同时影响宽度和高度
          if (isAutoWidth) {
            handles = handles.filter(h => h !== HandleDir.RIGHT)
          }
          if (isAutoHeight) {
            handles = handles.filter(h => h !== HandleDir.BOTTOM)
          }
        }
        
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