import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { CoordinateHelper, CoordinateSnapshot } from '../utils/coordinateHelper'

export type PointerMessageType =
  | 'move'
  | 'down'
  | 'up'
  | 'cancel'
  | 'enter-stage'
  | 'leave-stage'

export interface PointerMessage {
  type: PointerMessageType
  raw: PointerEvent
  pos: CoordinateSnapshot
  isDown: boolean
}

export type PointerSubscriber = (msg: PointerMessage) => void

export interface PointerHubAttachOptions {
  coord: CoordinateHelper
  stageEl?: HTMLElement | null
  listenTarget?: Document | HTMLElement
}

export interface PointerHub {
  latest: PointerMessage | null
  isDown: boolean
  subscribe: (sub: PointerSubscriber) => () => void
}

export const usePointerHubStore = defineStore('pointerHub', () => {
  const latest = ref<PointerMessage | null>(null)
  const isDown = ref(false)

  // 画布平移（pan）状态：从 Board 收口到这里，便于统一指针与键盘驱动的平移逻辑
  const panOffset = ref({ x: 0, y: 0 })
  const panState = reactive({
    isPanning: false,
    lastX: 0,
    lastY: 0,
    spaceKeyPressed: false
  })

  let coord: CoordinateHelper | null = null
  let target: Document | HTMLElement | null = null
  let stageEl: HTMLElement | null = null

  const subscribers = new Set<PointerSubscriber>()

  function emit(msg: PointerMessage) {
    latest.value = msg
    for (const sub of subscribers) sub(msg)
  }

  function snapshotFromEvent(e: PointerEvent): CoordinateSnapshot {
    const c = coord
    if (!c) {
      return {
        client: { x: e.clientX, y: e.clientY },
        wrapper: { x: e.clientX, y: e.clientY },
        canvas: { x: e.clientX, y: e.clientY }
      }
    }
    return c.snapshotFromClient({ x: e.clientX, y: e.clientY })
  }

  function onPointerMove(e: PointerEvent) {
    emit({ type: 'move', raw: e, pos: snapshotFromEvent(e), isDown: isDown.value })
  }

  function onPointerDown(e: PointerEvent) {
    isDown.value = true
    emit({ type: 'down', raw: e, pos: snapshotFromEvent(e), isDown: true })
  }

  function onPointerUp(e: PointerEvent) {
    isDown.value = false
    emit({ type: 'up', raw: e, pos: snapshotFromEvent(e), isDown: false })
  }

  function onPointerCancel(e: PointerEvent) {
    isDown.value = false
    emit({ type: 'cancel', raw: e, pos: snapshotFromEvent(e), isDown: false })
  }

  function onStageEnter(e: PointerEvent) {
    emit({ type: 'enter-stage', raw: e, pos: snapshotFromEvent(e), isDown: isDown.value })
  }

  function onStageLeave(e: PointerEvent) {
    emit({ type: 'leave-stage', raw: e, pos: snapshotFromEvent(e), isDown: isDown.value })
  }

  function subscribe(sub: PointerSubscriber) {
    subscribers.add(sub)
    return () => subscribers.delete(sub)
  }

  function detach() {
    if (target) {
      target.removeEventListener('pointermove', onPointerMove as any)
      target.removeEventListener('pointerdown', onPointerDown as any)
      target.removeEventListener('pointerup', onPointerUp as any)
      target.removeEventListener('pointercancel', onPointerCancel as any)
    }

    if (stageEl) {
      stageEl.removeEventListener('pointerenter', onStageEnter as any)
      stageEl.removeEventListener('pointerleave', onStageLeave as any)
    }

    target = null
    stageEl = null
    coord = null
    isDown.value = false
  }

  function attach(options: PointerHubAttachOptions) {
    detach()

    coord = options.coord
    stageEl = options.stageEl ?? null
    target = options.listenTarget ?? document

    target.addEventListener('pointermove', onPointerMove as any, { passive: true })
    target.addEventListener('pointerdown', onPointerDown as any, { passive: true })
    target.addEventListener('pointerup', onPointerUp as any, { passive: true })
    target.addEventListener('pointercancel', onPointerCancel as any, { passive: true })

    if (stageEl) {
      stageEl.addEventListener('pointerenter', onStageEnter as any, { passive: true })
      stageEl.addEventListener('pointerleave', onStageLeave as any, { passive: true })
    }
  }

  function isTypingInInput(): boolean {
    const activeElement = document.activeElement as HTMLElement | null
    if (!activeElement) return false
    return (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as any).isContentEditable
    )
  }

  function handlePanKeyDown(e: KeyboardEvent) {
    if (isTypingInInput()) return
    if (e.code === 'Space' && !e.repeat && !panState.spaceKeyPressed) {
      panState.spaceKeyPressed = true
      if (!panState.isPanning) document.body.style.cursor = 'grab'
    }
  }

  function handlePanKeyUp(e: KeyboardEvent) {
    if (e.code === 'Space') {
      panState.spaceKeyPressed = false
      if (!panState.isPanning) document.body.style.cursor = ''
    }
  }

  function startPan(e: MouseEvent) {
    if (e.button === 1 || (e.button === 0 && panState.spaceKeyPressed)) {
      panState.isPanning = true
      panState.lastX = e.clientX
      panState.lastY = e.clientY
      document.body.style.cursor = 'grabbing'
    }
  }

  function doPan(e: MouseEvent) {
    if (!panState.isPanning) return

    const dx = e.clientX - panState.lastX
    const dy = e.clientY - panState.lastY

    panOffset.value = {
      x: panOffset.value.x + dx,
      y: panOffset.value.y + dy
    }

    panState.lastX = e.clientX
    panState.lastY = e.clientY
  }

  function endPan() {
    if (!panState.isPanning) return
    panState.isPanning = false
    document.body.style.cursor = panState.spaceKeyPressed ? 'grab' : ''
  }

  return {
    latest,
    isDown,
    panOffset,
    panState,
    subscribe,
    attach,
    detach,

    // pan: 供 Board 事件直接调用
    handlePanKeyDown,
    handlePanKeyUp,
    startPan,
    doPan,
    endPan
  }
})
