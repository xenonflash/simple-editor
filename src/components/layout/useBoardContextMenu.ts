import { ref } from 'vue'
import type { Comp } from '../comps/base'
import { createComp } from '../comps/base'
import { CompType } from '../../types/component'
import { exportToJSON } from '../../utils/io'
import { history, ActionType } from '../../utils/history'

type MessageLike = {
  warning: (msg: string) => void
  error: (msg: string) => void
}

type PageStoreLike = {
  selectedComps: Comp[]
  editorMode: 'page' | 'custom-edit' | string
  findParentContainerId: (componentId: string) => string | null | undefined
  selectComponent: (componentId: string | null, multiSelect?: boolean) => void
  addComponentToCurrentPage: (component: Comp) => boolean
  updateComponentInCurrentPage: (component: Comp) => boolean
  deleteComponentFromCurrentPage: (componentId: string) => boolean
  getComponentCanvasPosition: (componentId: string) => { x: number; y: number } | null | undefined
  getComponentById: (componentId: string) => Comp | undefined
  currentComponents: Comp[]

  bringComponentToFront: (componentId: string) => boolean
  bringComponentForward: (componentId: string) => boolean
  sendComponentBackward: (componentId: string) => boolean
  sendComponentToBack: (componentId: string) => boolean
}

type CustomComponentsStoreLike = {
  addCustomComponent: (name: string, templateJson: string) => void
}

export function useBoardContextMenu(params: {
  pageStore: PageStoreLike
  customComponentsStore: CustomComponentsStoreLike
  message: MessageLike
}) {
  const { pageStore, customComponentsStore, message } = params

  const contextMenu = ref({
    show: false,
    x: 0,
    y: 0,
    component: null as Comp | null
  })

  function hideContextMenu() {
    contextMenu.value.show = false
  }

  function showContextMenu(event: MouseEvent, component: Comp) {
    event.preventDefault()

    contextMenu.value = {
      show: true,
      x: event.clientX,
      y: event.clientY,
      component
    }

    const isAlreadySelected = pageStore.selectedComps.some((c) => c.id === component.id)
    if (!isAlreadySelected) pageStore.selectComponent(component.id)

    document.addEventListener('click', hideContextMenu, { once: true })
  }

  function isProtectedRootContainerInCustomEdit(comp: Comp): boolean {
    if (pageStore.editorMode !== 'custom-edit') return false
    if (!comp || comp.type !== 'container') return false
    const parentId = pageStore.findParentContainerId(comp.id)
    return parentId === null
  }

  function getContextTarget(): Comp | null {
    const raw = contextMenu.value.component
    if (!raw) return null
    return pageStore.getComponentById(raw.id) || raw
  }

  function duplicateComponent() {
    const comp = getContextTarget()
    if (!comp) return

    const newComp = createComp(comp.type, `${comp.name} 副本`)

    newComp.props = {
      ...(comp.props || {}),
      x: ((comp.props as any)?.x || 0) + 20,
      y: ((comp.props as any)?.y || 0) + 20
    }

    history.addAction({
      type: ActionType.ADD,
      componentId: newComp.id,
      data: { after: newComp }
    })

    pageStore.addComponentToCurrentPage(newComp)
    pageStore.selectComponent(newComp.id)

    hideContextMenu()
  }

  function deepClone<T>(v: T): T {
    try {
      return structuredClone(v)
    } catch {
      return JSON.parse(JSON.stringify(v))
    }
  }

  function getCompCanvasRectForGroup(comp: Comp): { x: number; y: number; width: number; height: number } {
    const pos = pageStore.getComponentCanvasPosition(comp.id)
    const x = pos?.x ?? ((comp.props as any)?.x || 0)
    const y = pos?.y ?? ((comp.props as any)?.y || 0)

    const p: any = comp.props || {}
    const widthSizing = p.widthSizing as string | undefined
    const heightSizing = p.heightSizing as string | undefined
    const measuredW = Number(p._measuredWidth)
    const measuredH = Number(p._measuredHeight)
    const rawW = typeof p.width === 'number' ? p.width : Number(p.width)
    const rawH = typeof p.height === 'number' ? p.height : Number(p.height)

    const width = (widthSizing && widthSizing !== 'fixed' && Number.isFinite(measuredW))
      ? measuredW
      : (Number.isFinite(rawW) ? rawW : (Number.isFinite(measuredW) ? measuredW : 100))

    const height = (heightSizing && heightSizing !== 'fixed' && Number.isFinite(measuredH))
      ? measuredH
      : (Number.isFinite(rawH) ? rawH : (Number.isFinite(measuredH) ? measuredH : 100))

    return { x, y, width, height }
  }

  function saveAsCustomComponent() {
    const selected = pageStore.selectedComps
    const contextTarget = getContextTarget()
    const targetComps = selected.length > 0 ? selected : (contextTarget ? [contextTarget] : [])

    if (targetComps.length === 0) {
      hideContextMenu()
      return
    }

    const defaultName = targetComps.length > 1 ? `组件组(${targetComps.length})` : `${targetComps[0].name || '组件'}`
    const name = (window.prompt('组件名称', defaultName) || '').trim() || defaultName

    let root: Comp
    if (targetComps.length === 1) {
      root = deepClone(targetComps[0])
      root.props = { ...(root.props || {}), x: 0, y: 0 }
    } else {
      const rects = targetComps.map(getCompCanvasRectForGroup)
      const minX = Math.min(...rects.map((r) => r.x))
      const minY = Math.min(...rects.map((r) => r.y))
      const maxX = Math.max(...rects.map((r) => r.x + r.width))
      const maxY = Math.max(...rects.map((r) => r.y + r.height))
      const groupW = Math.max(1, maxX - minX)
      const groupH = Math.max(1, maxY - minY)

      root = createComp(CompType.CONTAINER, name)
      root.props = {
        ...(root.props || {}),
        x: 0,
        y: 0,
        width: groupW,
        height: groupH,
        widthSizing: 'fixed',
        heightSizing: 'fixed',
        layoutMode: 'absolute'
      }

      root.children = targetComps.map((c) => {
        const cloned = deepClone(c)
        const r = getCompCanvasRectForGroup(c)
        cloned.props = { ...(cloned.props || {}), x: r.x - minX, y: r.y - minY }
        return cloned
      })
    }

    const templateJson = exportToJSON([root])
    customComponentsStore.addCustomComponent(name, templateJson)

    hideContextMenu()
  }

  function bringToFront() {
    const comp = getContextTarget()
    if (!comp) return

    pageStore.bringComponentToFront(comp.id)
    hideContextMenu()
  }

  function sendToBack() {
    const comp = getContextTarget()
    if (!comp) return

    pageStore.sendComponentToBack(comp.id)

    hideContextMenu()
  }

  function bringForward() {
    const comp = getContextTarget()
    if (!comp) return

    pageStore.bringComponentForward(comp.id)

    hideContextMenu()
  }

  function sendBackward() {
    const comp = getContextTarget()
    if (!comp) return

    pageStore.sendComponentBackward(comp.id)

    hideContextMenu()
  }

  function deleteComponentFromMenu() {
    const comp = getContextTarget()
    if (!comp) return

    if (isProtectedRootContainerInCustomEdit(comp)) {
      message.warning('组件编辑模式下不允许删除最外层容器')
      hideContextMenu()
      return
    }

    history.addAction({
      type: ActionType.DELETE,
      componentId: comp.id,
      data: { before: comp }
    })

    pageStore.deleteComponentFromCurrentPage(comp.id)
    pageStore.selectComponent(null)

    hideContextMenu()
  }

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
    duplicateComponent,
    saveAsCustomComponent,
    bringToFront,
    bringForward,
    sendBackward,
    sendToBack,
    deleteComponentFromMenu
  }
}
