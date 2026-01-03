import { inject, onMounted, onUnmounted, type Ref } from 'vue'
import { usePageStore } from '../stores/page'
import { COORDINATE_HELPER_KEY } from './coordinateHelper'

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
    const comp = pageStore.getComponentById(options.componentId)
    if (!comp) return

    const prevW = (comp.props as any)._measuredWidth || 0
    const prevH = (comp.props as any)._measuredHeight || 0

    const rect = options.elementRef.value?.getBoundingClientRect()
    const nextPos = rect && coord ? coord.clientToCanvas({ x: rect.left, y: rect.top }) : null
    const prevX = (comp.props as any)._measuredCanvasX
    const prevY = (comp.props as any)._measuredCanvasY

    const posChanged = nextPos
      ? !Number.isFinite(prevX) || !Number.isFinite(prevY) || Math.abs(nextPos.x - prevX) > threshold || Math.abs(nextPos.y - prevY) > threshold
      : false

    if (Math.abs(width - prevW) > threshold || Math.abs(height - prevH) > threshold || posChanged) {
      pageStore.updateComponentInCurrentPage({
        ...comp,
        props: {
          ...comp.props,
          _measuredWidth: width,
          _measuredHeight: height,
          ...(nextPos ? { _measuredCanvasX: nextPos.x, _measuredCanvasY: nextPos.y } : {})
        }
      })
    }
  }

  onMounted(() => {
    if (!options.elementRef.value) return

    updateMeasured(options.elementRef.value.offsetWidth, options.elementRef.value.offsetHeight)
    resizeObserver = new ResizeObserver(() => {
      if (!options.elementRef.value) return
      updateMeasured(options.elementRef.value.offsetWidth, options.elementRef.value.offsetHeight)
    })
    resizeObserver.observe(options.elementRef.value)
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
  })
}
