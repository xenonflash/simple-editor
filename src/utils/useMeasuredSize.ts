import { onMounted, onUnmounted, type Ref } from 'vue'
import { usePageStore } from '../stores/page'

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
  const threshold = options.threshold ?? 1

  let resizeObserver: ResizeObserver | null = null

  function updateMeasuredSize(width: number, height: number) {
    const comp = pageStore.getComponentById(options.componentId)
    if (!comp) return

    const prevW = (comp.props as any)._measuredWidth || 0
    const prevH = (comp.props as any)._measuredHeight || 0

    if (Math.abs(width - prevW) > threshold || Math.abs(height - prevH) > threshold) {
      pageStore.updateComponentInCurrentPage({
        ...comp,
        props: {
          ...comp.props,
          _measuredWidth: width,
          _measuredHeight: height
        }
      })
    }
  }

  onMounted(() => {
    if (!options.elementRef.value) return

    updateMeasuredSize(options.elementRef.value.offsetWidth, options.elementRef.value.offsetHeight)
    resizeObserver = new ResizeObserver(() => {
      if (!options.elementRef.value) return
      updateMeasuredSize(options.elementRef.value.offsetWidth, options.elementRef.value.offsetHeight)
    })
    resizeObserver.observe(options.elementRef.value)
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
  })
}
