import { inject, onMounted, onUnmounted, nextTick, type Ref } from 'vue'
import { usePageStore } from '../stores/page'
import { COORDINATE_HELPER_KEY } from './coordinateHelper'
import { parseLoopInstanceId } from './loopInstance'

export interface UseMeasuredSizeOptions {
  elementRef: Ref<HTMLElement | null>
  componentId: string
  threshold?: number
}

/**
 * Observe element size and persist it to component props as `_measuredWidth/_measuredHeight`.
 * Used for non-fixed sizing (fill/content) so Controls can stay in sync with actual rendered size.
 */
export function useMeasuredSize(options: UseMeasuredSizeOptions) {
  const pageStore = usePageStore()
  const coord = inject(COORDINATE_HELPER_KEY, null)
  const threshold = options.threshold ?? 1

  let resizeObserver: ResizeObserver | null = null

  function updateMeasured(width: number, height: number) {
    const info = parseLoopInstanceId(options.componentId)
    // loop 实例会同时渲染多份 DOM，不能把所有实例的测量值都写回同一个源组件，否则会抖动。
    // 约定：仅 index=0 的实例写回源组件，其他实例跳过。
    if (info.index !== null && info.index !== 0) return

    const comp = pageStore.getComponentById(info.sourceId)
    if (!comp) return

    const prevW = (comp.props as any)._measuredWidth || 0
    const prevH = (comp.props as any)._measuredHeight || 0

    const nextSize = coord ? coord.clientDeltaToCanvas({ x: width, y: height }) : { x: width, y: height }

    const rect = options.elementRef.value?.getBoundingClientRect()
    const nextPos = rect && coord ? coord.clientToCanvas({ x: rect.left, y: rect.top }) : null
    const prevX = (comp.props as any)._measuredCanvasX
    const prevY = (comp.props as any)._measuredCanvasY

    const posChanged = nextPos
      ? !Number.isFinite(prevX) || !Number.isFinite(prevY) || Math.abs(nextPos.x - prevX) > threshold || Math.abs(nextPos.y - prevY) > threshold
      : false

    if (Math.abs(nextSize.x - prevW) > threshold || Math.abs(nextSize.y - prevH) > threshold || posChanged) {
      pageStore.updateComponentInCurrentPage({
        ...comp,
        props: {
          ...comp.props,
          _measuredWidth: nextSize.x,
          _measuredHeight: nextSize.y,
          ...(nextPos ? { _measuredCanvasX: nextPos.x, _measuredCanvasY: nextPos.y } : {})
        }
      })
    }
  }

  onMounted(() => {
    if (!options.elementRef.value) return

    const doMeasure = () => {
      if (!options.elementRef.value) return
      const rect = options.elementRef.value.getBoundingClientRect()
      const width = Math.round(rect.width * 10) / 10
      const height = Math.round(rect.height * 10) / 10
      updateMeasured(width, height)
    }

    nextTick(() => {
      doMeasure()
      setTimeout(doMeasure, 100)
    })

    const resizeObserver = new ResizeObserver(() => {
      if (!options.elementRef.value) return
      const rect = options.elementRef.value.getBoundingClientRect()
      const width = Math.round(rect.width * 10) / 10
      const height = Math.round(rect.height * 10) / 10
      updateMeasured(width, height)
    })
    resizeObserver.observe(options.elementRef.value)
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
  })
}
