import { ref, type Ref } from 'vue'
import { usePointerHubStore } from '@/stores/pointerHub'
import type { CoordinateHelper } from '@/utils/coordinateHelper'

export function useBoardZoom(options: {
  wrapperRef: Ref<HTMLElement | null>
  canvasWidth: Ref<number>
  canvasHeight: Ref<number>
  scale: Ref<number>
  coord: CoordinateHelper
}) {
  const { wrapperRef, canvasWidth, canvasHeight, scale, coord } = options
  
  const minScale = 0.1
  const maxScale = 3
  const scaleStep = 0.1
  
  const pointerHubStore = usePointerHubStore()
  
  // 缩放函数（工具栏按钮用）
  function zoomIn() {
    setScale(scale.value + scaleStep)
  }

  function zoomOut() {
    setScale(scale.value - scaleStep)
  }

  function resetZoom() {
    setScale(1)
  }

  function setScale(newScale: number, center?: { x: number; y: number }) {
    const oldScale = scale.value
    newScale = Math.max(minScale, Math.min(maxScale, newScale))
    if (Math.abs(newScale - oldScale) < 0.00001) return

    // 如果未提供中心，默认使用视口中心
    let zoomCenter = center
    if (!zoomCenter && wrapperRef.value) {
      const rect = wrapperRef.value.getBoundingClientRect()
      zoomCenter = {
        x: rect.width / 2,
        y: rect.height / 2
      }
    }
    if (!zoomCenter) zoomCenter = { x: 0, y: 0 }

    const scaleFactor = newScale / oldScale
    
    // Pan offset 存储在 pointerHub 中
    const currentPan = pointerHubStore.panOffset
    const dx = (zoomCenter.x - currentPan.x) * (1 - scaleFactor)
    const dy = (zoomCenter.y - currentPan.y) * (1 - scaleFactor)

    scale.value = newScale
    pointerHubStore.panOffset = {
      x: currentPan.x + dx,
      y: currentPan.y + dy
    }
  }

  // 处理触控板手势
  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    
    // 如果还没挂载好 coord，就先不处理
    if (!coord) return

    // 检测是否是缩放手势（触控板双指捏合或 Command + 滚轮）
    if (e.ctrlKey || e.metaKey) {
      const delta = -e.deltaY
      const zoomFactor = Math.pow(1.01, delta)
      const newScale = Math.max(minScale, Math.min(maxScale, scale.value * zoomFactor))
      
      // 使用鼠标在 wrapper 中的位置作为缩放中心
      const mouseLocal = coord.clientToWrapper({ x: e.clientX, y: e.clientY })
      setScale(newScale, { x: mouseLocal.x, y: mouseLocal.y })
      return
    }

    // 处理平移，考虑设备像素比
    const pixelRatio = window.devicePixelRatio || 1
    pointerHubStore.panOffset = {
      x: pointerHubStore.panOffset.x - e.deltaX / pixelRatio,
      y: pointerHubStore.panOffset.y - e.deltaY / pixelRatio
    }
  }
  
  // 初始化画布居中
  function initializeCanvas() {
    if (!wrapperRef.value) return
    
    const rect = wrapperRef.value.getBoundingClientRect()
    
    // 使用动态画布尺寸
    const currentCanvasWidth = canvasWidth.value
    const currentCanvasHeight = canvasHeight.value
    
    // 计算适合视口的缩放比例，留出边距
    const padding = 80 // 边距
    const availableWidth = rect.width - padding * 2
    const availableHeight = rect.height - padding * 2
    
    const scaleX = availableWidth / currentCanvasWidth
    const scaleY = availableHeight / currentCanvasHeight
    const fitScale = Math.min(scaleX, scaleY, 1) // 最大不超过100%
    
    // 设置缩放
    scale.value = fitScale
    
    // 计算缩放后的画布尺寸
    const scaledWidth = currentCanvasWidth * fitScale
    const scaledHeight = currentCanvasHeight * fitScale
    
    // 计算居中位置（画布左上角的位置）
    const centerX = (rect.width - scaledWidth) / 2
    const centerY = (rect.height - scaledHeight) / 2
    
    pointerHubStore.panOffset = {
      x: centerX,
      y: centerY
    }
  }

  return {
    scale,
    setScale,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    initializeCanvas
  }
}
