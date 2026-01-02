import type { InjectionKey, Ref } from 'vue'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useSnaplineStore } from '../../stores/snapline'

export type ContainerLayoutMode = 'absolute' | 'default' | 'flex'

export interface CanvasRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ContainerHit {
  id: string
  rect: CanvasRect
  zIndex: number
  layoutMode: ContainerLayoutMode
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
}

export interface DropPreview {
  active: boolean
  containerId: string | null
  containerRect: CanvasRect | null
  ghostRect: CanvasRect | null
  layoutMode: ContainerLayoutMode | null
}

export interface MoveToContainerPayload {
  componentId: string
  containerId: string
  layoutMode: ContainerLayoutMode
  localX?: number
  localY?: number
}

export interface DropPreviewStoreOptions {
  wrapperRef: Ref<HTMLElement | null>
  scale: Ref<number>
  panOffset: Ref<{ x: number; y: number }>
  getContainers: () => ContainerHit[]
  canDragIntoContainer?: (componentId: string) => boolean
  hoverActivateMs?: number
  onMoveToContainer: (payload: MoveToContainerPayload) => void
}

export interface DropPreviewStore {
  preview: Ref<DropPreview>
  hoverContainerId: Ref<string | null>
  activeContainerId: Ref<string | null>
  mouseClient: Ref<{ x: number; y: number } | null>
  mouseCanvas: Ref<{ x: number; y: number } | null>
}

export const DROP_PREVIEW_STORE_KEY: InjectionKey<DropPreviewStore> = Symbol('DROP_PREVIEW_STORE') as InjectionKey<DropPreviewStore>

export function useDropPreviewStore(options: DropPreviewStoreOptions) {
  const snaplineStore = useSnaplineStore()

  const hoverActivateMs = options.hoverActivateMs ?? 400

  const mouseClient = ref<{ x: number; y: number } | null>(null)
  const mouseCanvas = ref<{ x: number; y: number } | null>(null)

  const isDraggingComponent = computed(() => !!snaplineStore.draggingComponent)
  const draggingRect = computed(() => snaplineStore.draggingComponent)

  const hoverContainerId = ref<string | null>(null)
  const activeContainerId = ref<string | null>(null)

  const lastHit = ref<ContainerHit | null>(null)
  const lastDraggingRect = ref<{ id: string; x: number; y: number; width: number; height: number } | null>(null)

  const preview = ref<DropPreview>({
    active: false,
    containerId: null,
    containerRect: null,
    ghostRect: null,
    layoutMode: null
  })

  let hoverTimer: number | null = null

  function clearHoverTimer() {
    if (hoverTimer) {
      window.clearTimeout(hoverTimer)
      hoverTimer = null
    }
  }

  function screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
    const wrapperRect = options.wrapperRef.value?.getBoundingClientRect()
    if (!wrapperRect) return { x: 0, y: 0 }

    const wrapperX = screenX - wrapperRect.left
    const wrapperY = screenY - wrapperRect.top

    return {
      x: (wrapperX - options.panOffset.value.x) / options.scale.value,
      y: (wrapperY - options.panOffset.value.y) / options.scale.value
    }
  }

  function findContainerHitAtPoint(canvasX: number, canvasY: number): ContainerHit | null {
    const candidates = options
      .getContainers()
      .filter((c) => canvasX >= c.rect.x && canvasX <= c.rect.x + c.rect.width && canvasY >= c.rect.y && canvasY <= c.rect.y + c.rect.height)
      .sort((a, b) => b.zIndex - a.zIndex)

    return candidates[0] || null
  }

  function calcGhostRect(drag: { x: number; y: number; width: number; height: number }, hit: ContainerHit): CanvasRect {
    const contentX = hit.rect.x + hit.paddingLeft
    const contentY = hit.rect.y + hit.paddingTop
    const contentW = Math.max(0, hit.rect.width - hit.paddingLeft - hit.paddingRight)
    const contentH = Math.max(0, hit.rect.height - hit.paddingTop - hit.paddingBottom)

    if (hit.layoutMode !== 'absolute') {
      return {
        x: contentX,
        y: contentY,
        width: Math.min(drag.width, contentW || drag.width),
        height: Math.min(drag.height, contentH || drag.height)
      }
    }

    const maxX = contentX + Math.max(0, contentW - drag.width)
    const maxY = contentY + Math.max(0, contentH - drag.height)

    return {
      x: Math.max(contentX, Math.min(drag.x, maxX)),
      y: Math.max(contentY, Math.min(drag.y, maxY)),
      width: drag.width,
      height: drag.height
    }
  }

  function updatePreview() {
    const hit = lastHit.value
    const drag = lastDraggingRect.value
    if (!hit || !drag || !activeContainerId.value || hit.id !== activeContainerId.value) {
      preview.value = { active: false, containerId: null, containerRect: null, ghostRect: null, layoutMode: null }
      return
    }

    const ghost = calcGhostRect(drag, hit)
    preview.value = {
      active: true,
      containerId: hit.id,
      containerRect: hit.rect,
      ghostRect: ghost,
      layoutMode: hit.layoutMode
    }
  }

  function resetHoverState() {
    clearHoverTimer()
    hoverContainerId.value = null
    activeContainerId.value = null
    lastHit.value = null
    updatePreview()
  }

  function startHoverActivationTimer(nextHoverId: string) {
    clearHoverTimer()
    hoverTimer = window.setTimeout(() => {
      if (!draggingRect.value) return
      if (hoverContainerId.value !== nextHoverId) return
      activeContainerId.value = nextHoverId
      updatePreview()
    }, hoverActivateMs)
  }

  function onWindowMouseMove(e: MouseEvent) {
    mouseClient.value = { x: e.clientX, y: e.clientY }
    mouseCanvas.value = screenToCanvas(e.clientX, e.clientY)
  }

  watch(
    draggingRect,
    (next, prev) => {
      if (!next && prev) {
        const dropTargetId = activeContainerId.value
        const lastHoverId = hoverContainerId.value
        const lastDrag = lastDraggingRect.value
        const hit = lastHit.value

        resetHoverState()
        lastDraggingRect.value = null

        if (!dropTargetId || dropTargetId !== lastHoverId) return
        if (!lastDrag || !hit || hit.id !== dropTargetId) return

        const ghost = calcGhostRect(lastDrag, hit)
        const localX = ghost.x - (hit.rect.x + hit.paddingLeft)
        const localY = ghost.y - (hit.rect.y + hit.paddingTop)

        options.onMoveToContainer({
          componentId: lastDrag.id,
          containerId: hit.id,
          layoutMode: hit.layoutMode,
          localX,
          localY
        })
        return
      }

      if (!next) {
        resetHoverState()
        lastDraggingRect.value = null
        return
      }

      // 不允许进入容器拖入模式（例如：拖动 container 本身）
      if (options.canDragIntoContainer && !options.canDragIntoContainer(next.id)) {
        resetHoverState()
        lastDraggingRect.value = null
        return
      }

      lastDraggingRect.value = next

      const cx = next.x + next.width / 2
      const cy = next.y + next.height / 2
      const hit = findContainerHitAtPoint(cx, cy)
      lastHit.value = hit

      if (!hit) {
        resetHoverState()
        return
      }

      if (hoverContainerId.value !== hit.id) {
        hoverContainerId.value = hit.id
        activeContainerId.value = null
        startHoverActivationTimer(hit.id)
      }

      updatePreview()
    },
    { immediate: true }
  )

  watch(
    isDraggingComponent,
    (dragging) => {
      if (dragging) {
        window.addEventListener('mousemove', onWindowMouseMove)
      } else {
        window.removeEventListener('mousemove', onWindowMouseMove)
        mouseClient.value = null
        mouseCanvas.value = null
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    clearHoverTimer()
    window.removeEventListener('mousemove', onWindowMouseMove)
  })

  return {
    preview,
    // 预留：后续如果需要把 hover/active 暴露给 UI 做更丰富提示
    hoverContainerId,
    activeContainerId,
    mouseClient,
    mouseCanvas
  } satisfies DropPreviewStore
}
