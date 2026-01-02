// Back-compat shim: keep the old name exports to reduce churn.
export {
  DROP_PREVIEW_STORE_KEY as BOARD_MOUSE_EVENT_MANAGER_KEY,
  useDropPreviewStore as createBoardMouseEventManager
} from './useDropPreviewStore'

export type {
  ContainerLayoutMode,
  CanvasRect,
  ContainerHit,
  DropPreview,
  MoveToContainerPayload,
  DropPreviewStoreOptions as BoardMouseEventManagerOptions
} from './useDropPreviewStore'
