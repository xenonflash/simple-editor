import { defineStore } from 'pinia'
import { ref } from 'vue'
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

  return {
    latest,
    isDown,
    subscribe,
    attach,
    detach
  }
})
