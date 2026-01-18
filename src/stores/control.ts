import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Comp } from '../components/comps/base'
import { usePageStore } from './page'
import { CompType } from '../types/component'
import { parseLoopInstanceId } from '../utils/loopInstance'
import { LOOP_OFFSET_STEP } from '../utils/renderLoop'

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
  const widthSizing = (comp.props as any).widthSizing as ('fixed' | 'fill' | 'content' | undefined)
  const heightSizing = (comp.props as any).heightSizing as ('fixed' | 'fill' | 'content' | undefined)

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
  
  // 处理 Naive UI 组件的默认尺寸
  if (comp.type.startsWith('n-')) {
    // 非 fixed sizing 时，优先用测量值（即使存在显式 width/height）
    if (widthSizing && widthSizing !== 'fixed' && comp.props._measuredWidth) width = comp.props._measuredWidth
    else if (comp.props.width) width = comp.props.width
    else if (comp.props._measuredWidth) width = comp.props._measuredWidth

    if (heightSizing && heightSizing !== 'fixed' && comp.props._measuredHeight) height = comp.props._measuredHeight
    else if (comp.props.height) height = comp.props.height
    else if (comp.props._measuredHeight) height = comp.props._measuredHeight

    // 如果没有显式设置宽高且没有测量值，使用默认值
    if (!width) width = 120;
    if (!height) height = 34;
  }

  // 非 Naive 组件：若 sizing 非 fixed 且存在测量值，也优先使用
  // 自动布局模式下（layoutMode: 'auto'），无论 sizing 如何，都应使用测量值
  if (!comp.type.startsWith('n-')) {
    const layoutMode = comp.props.layoutMode || 'manual'
    const isAutoLayout = layoutMode === 'auto'
    if (isAutoLayout) {
      if (comp.props._measuredWidth) width = comp.props._measuredWidth
      if (comp.props._measuredHeight) height = comp.props._measuredHeight
    } else {
      if (widthSizing && widthSizing !== 'fixed' && comp.props._measuredWidth) width = comp.props._measuredWidth
      if (heightSizing && heightSizing !== 'fixed' && comp.props._measuredHeight) height = comp.props._measuredHeight
    }
  }
  
  return { width, height }
}

// 获取 DOM 元素相对于画布内容区 (.canvas-content) 的位置和尺寸
function getDomInfo(id: string): { x: number; y: number; width: number; height: number } | null {
  // 优先尝试 ID，但因为 Vue props 可能会消费 id 导致未绑定到 DOM，所以也尝试 data-comp-id
  let el = document.getElementById(id)
  if (!el) {
    el = document.querySelector(`[data-comp-id="${id}"]`) as HTMLElement
  }
  
  if (!el) return null

  const rect = el.getBoundingClientRect()
  
  // 查找画布内容容器
  // 我们通过向上遍历找到 class 为 canvas-content 的祖先
  let container = el.offsetParent as HTMLElement
  while (container && !container.classList.contains('canvas-content')) {
    container = container.offsetParent as HTMLElement
  }
  
  // 如果找不到 canvas-content（可能未挂载或结构不同），尝试使用通用的 .canvas-content 查询
  // 注意：这假设页面上只有一个活动的编辑器画布
  if (!container) {
    container = document.querySelector('.canvas-content') as HTMLElement
  }
  
  if (!container) return null

  const containerRect = container.getBoundingClientRect()
  
  // 计算缩放比例 (假设容器无旋转)
  // 通过检查元素当前的offsetWidth与rect.width的关系？
  // 不，更可靠的是直接用 rect 差值除以当前的全局 scale。
  // 但是这里我们没有 scale 变量。
  // 幸好：Controls 组件和 render 出来的组件都在同一个缩放容器 (.canvas-wrapper) 下的 (.canvas-content) 中。
  // 所以它们处于相同的 transform context。
  // 如果 Controls 和 组件 都是 .canvas-content 的子元素（Controls 使用 absolute 定位），
  // 那么我们只需要它们在 .canvas-content 坐标系下的偏移。
  
  // offsetLeft/Top 的问题是它包含父级的边框等，且受 position 影响。
  // getBoundingClientRect 是视口坐标。
  // (elRect.x - containerRect.x) 是两者在屏幕上的像素距离（包含缩放）。
  // 这个距离 = 原始距离 * scale。
  // 所以我们需要 scale。
  
  // 尝试反推 scale: container 的 rect.width / offsetWidth
  const scaleX = containerRect.width / container.offsetWidth
  // 避免除以0
  const scale = Number.isFinite(scaleX) && scaleX > 0 ? scaleX : 1

  return {
    x: (rect.left - containerRect.left) / scale,
    y: (rect.top - containerRect.top) / scale,
    width: rect.width / scale,
    height: rect.height / scale
  }
}

export const useControlStore = defineStore('control', () => {
  const pageStore = usePageStore()
  
  // 计算控制点数组
  const controls = computed<ControlPoint[]>(() => {
    const selectedComps = pageStore.selectedComps
    const result: ControlPoint[] = []
    
    selectedComps.forEach(comp => {
      // 优先尝试使用 DOM 测量值（解决 Flex/Flow 布局及循环实例定位问题）
      const domInfo = getDomInfo(comp.id)
      
      let width, height, x, y
      
      if (domInfo) {
        width = domInfo.width
        height = domInfo.height
        x = domInfo.x
        y = domInfo.y
      } else {
        // 降级回退到 Props 计算逻辑
        const size = getComponentActualSize(comp)
        width = size.width
        height = size.height
        
        const pos = pageStore.getComponentCanvasPosition(comp.id)
        x = pos?.x ?? (comp.props.x || 0)
        y = pos?.y ?? (comp.props.y || 0)

        // 手动计算循环实例的偏移
        // ... (旧逻辑保留作为 fallback)
        const loopInfo = parseLoopInstanceId(comp.id)
        if (loopInfo.index !== null && loopInfo.index > 0) {
           // 源组件的局部坐标
          const sourceLocalX = Number(comp.props.x) || 0
          const sourceLocalY = Number(comp.props.y) || 0
          
          let instanceLocalX = sourceLocalX
          let instanceLocalY = sourceLocalY
          
          const indexStr = String(loopInfo.index)
          const overrides = (comp.props as any).loopOverrides?.[indexStr]
          const hasOverrideX = overrides && Object.prototype.hasOwnProperty.call(overrides, 'x')
          const hasOverrideY = overrides && Object.prototype.hasOwnProperty.call(overrides, 'y')
          
          const defaultOffset = loopInfo.index * LOOP_OFFSET_STEP
          
          if (hasOverrideX) {
            instanceLocalX = Number(overrides.x)
          } else {
            instanceLocalX += defaultOffset
          }

          if (hasOverrideY) {
            instanceLocalY = Number(overrides.y)
          } else {
            instanceLocalY += defaultOffset
          }
          
          x = x - sourceLocalX + instanceLocalX
          y = y - sourceLocalY + instanceLocalY
        }
      }
      
      // 1. 选中边框
      result.push({
        id: `selection-${comp.id}`,
        type: 'selection',
        componentId: comp.id,
        x,
        y,
        width,
        height
      })
      
      // 2. 调整手柄 (仅当组件支持调整大小时显示)
      const isNaive = comp.type.startsWith('n-')
      
      if (isNaive) {
        // Naive 组件特殊处理
        if ([
          CompType.N_INPUT, CompType.N_SELECT, CompType.N_DATE_PICKER, CompType.N_TIME_PICKER,
          CompType.N_CHECKBOX, CompType.N_RADIO_GROUP, CompType.N_COLOR_PICKER, CompType.N_CASCADER,
          CompType.N_RATE, CompType.N_SLIDER, CompType.N_BREADCRUMB, CompType.N_STEPS
        ].includes(comp.type as CompType)) {
          // 输入类/单行类组件允许调整宽度
          result.push(
            { id: `resize-${comp.id}-l`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.LEFT },
            { id: `resize-${comp.id}-r`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.RIGHT }
          )
        } else if ([
          CompType.N_TREE, CompType.N_MENU, CompType.N_IMAGE, CompType.N_TIMELINE,
          CompType.N_TABS, CompType.N_CAROUSEL, CompType.N_LIST
        ].includes(comp.type as CompType)) {
          // 容器/列表/图片类组件允许自由调整大小
          result.push(
            { id: `resize-${comp.id}-tl`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.TOP_LEFT },
            { id: `resize-${comp.id}-tr`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.TOP_RIGHT },
            { id: `resize-${comp.id}-bl`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.BOTTOM_LEFT },
            { id: `resize-${comp.id}-br`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.BOTTOM_RIGHT },
            { id: `resize-${comp.id}-t`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.TOP },
            { id: `resize-${comp.id}-r`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.RIGHT },
            { id: `resize-${comp.id}-b`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.BOTTOM },
            { id: `resize-${comp.id}-l`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.LEFT }
          )
        }
      } else {
        // 普通组件
        if (comp.type === CompType.TEXT) {
          // 文本组件只显示右侧和底部手柄（用于调整容器大小，虽然通常是自动的）
          // 实际上文本组件通常不需要顶部手柄，这里恢复旧逻辑
          const isAutoWidth = comp.props.widthMode === 'auto'
          const isAutoHeight = comp.props.autoHeight
          
          let handles = [HandleDir.RIGHT, HandleDir.BOTTOM]
          
          if (isAutoWidth) handles = handles.filter(h => h !== HandleDir.RIGHT)
          if (isAutoHeight) handles = handles.filter(h => h !== HandleDir.BOTTOM)
          
          handles.forEach(handle => {
            result.push({
              id: `resize-${comp.id}-${handle}`,
              type: 'resize',
              componentId: comp.id,
              x, y, width, height, handle
            })
          })
        } else {
          // 其他普通组件显示所有手柄
          // 四角手柄
          result.push(
            { id: `resize-${comp.id}-tl`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.TOP_LEFT },
            { id: `resize-${comp.id}-tr`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.TOP_RIGHT },
            { id: `resize-${comp.id}-bl`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.BOTTOM_LEFT },
            { id: `resize-${comp.id}-br`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.BOTTOM_RIGHT }
          )
          
          // 边中点手柄
          result.push(
            { id: `resize-${comp.id}-t`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.TOP },
            { id: `resize-${comp.id}-r`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.RIGHT },
            { id: `resize-${comp.id}-b`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.BOTTOM },
            { id: `resize-${comp.id}-l`, type: 'resize', componentId: comp.id, x, y, width, height, handle: HandleDir.LEFT }
          )
        }
      }
    })
    
    return result
  })

  return {
    controls
  }
})