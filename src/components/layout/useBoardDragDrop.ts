import { ref, computed } from 'vue'
import { usePageStore } from '@/stores/page'
import { useCustomComponentsStore } from '@/stores/customComponents'
import { useMessage } from 'naive-ui'
import type { CompType } from '@/types/component'
import { createComp } from '@/components/comps/base'
import { history, ActionType } from '@/utils/history'
import { importFromJSON } from '@/utils/io'
import { instantiateFromCustomComponentTemplate } from '@/utils/customComponentInstance'
import type { CoordinateHelper } from '@/utils/coordinateHelper'

export function useBoardDragDrop(options: {
  components: any[] // to calculate next z-index
  coord: CoordinateHelper
  getContainerHits: () => any[]
}) {
  const { components, coord, getContainerHits } = options
  const pageStore = usePageStore()
  const customComponentsStore = useCustomComponentsStore()
  
  const dropIndicator = ref<{ show: boolean; containerId: string | null; x: number; y: number; width: number; height: number }>({
    show: false,
    containerId: null,
    x: 0,
    y: 0,
    width: 0,
    height: 0
  })

  const dropIndicatorStyle = computed(() => ({
    position: 'absolute',
    left: `${dropIndicator.value.x}px`,
    top: `${dropIndicator.value.y}px`,
    width: `${dropIndicator.value.width}px`,
    height: `${dropIndicator.value.height}px`,
    border: '2px dashed #1890ff',
    background: 'rgba(24, 144, 255, 0.06)',
    pointerEvents: 'none',
    boxSizing: 'border-box'
  } as any))

  function findContainerHit(canvasX: number, canvasY: number): { containerId: string; x: number; y: number; width: number; height: number } | null {
    const candidates = getContainerHits()
      .map((c) => ({ id: c.id, x: c.rect.x, y: c.rect.y, width: c.rect.width, height: c.rect.height, z: c.zIndex }))
      .filter((r) => canvasX >= r.x && canvasX <= r.x + r.width && canvasY >= r.y && canvasY <= r.y + r.height)
      .sort((a, b) => b.z - a.z)

    const top = candidates[0]
    if (!top) return null
    return { containerId: top.id, x: top.x, y: top.y, width: top.width, height: top.height }
  }

  // 获取下一个可用的zIndex
  function getNextZIndex(): number {
    if (components.length === 0) return 1
    const maxZIndex = Math.max(...components.map((c: any) => c.props.zIndex || 1))
    return maxZIndex + 1
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }

    const customComponentId = e.dataTransfer?.getData('customComponentId') || ''
    const componentType = e.dataTransfer?.getData('componentType') as CompType

    // Check if types indicate a valid drag (since getData is restricted in dragover)
    let hasValidType = false
    if (e.dataTransfer?.types) {
      const types = Array.from(e.dataTransfer.types).map(t => t.toLowerCase())
      hasValidType = types.includes('customcomponentid') || types.includes('componenttype')
    }

    if (!customComponentId && !componentType && !hasValidType) {
      dropIndicator.value.show = false
      dropIndicator.value.containerId = null
      return
    }

    const canvasPos = coord.clientToCanvas({ x: e.clientX, y: e.clientY })
    const hit = findContainerHit(canvasPos.x, canvasPos.y)
    if (hit) {
      dropIndicator.value = {
        show: true,
        containerId: hit.containerId,
        x: hit.x,
        y: hit.y,
        width: hit.width,
        height: hit.height
      }
    } else {
      dropIndicator.value.show = false
      dropIndicator.value.containerId = null
    }
  }

  function handleDragLeave() {
    dropIndicator.value.show = false
    dropIndicator.value.containerId = null
  }

  function handleDrop(e: DragEvent, emit: any) {
    e.preventDefault()
    const customComponentId = e.dataTransfer?.getData('customComponentId') || ''
    const componentType = e.dataTransfer?.getData('componentType') as CompType
    if (!customComponentId && !componentType) return

    // 使用统一的坐标转换函数
    const canvasPos = coord.clientToCanvas({ x: e.clientX, y: e.clientY })

    const hit = findContainerHit(canvasPos.x, canvasPos.y)

    if (customComponentId) {
      const def = customComponentsStore.getById(customComponentId)
      if (!def) return

      const buildDefaultsFromSchema = (schema: any): Record<string, any> => {
        const res: Record<string, any> = {}
        const src = (schema && typeof schema === 'object') ? schema : {}
        for (const [k, s] of Object.entries(src)) {
          const ss: any = s
          if (ss && Object.prototype.hasOwnProperty.call(ss, 'manual')) {
            res[k] = ss.default
            continue
          }
          const t = ss?.type
          if (t === 'number') res[k] = 0
          else if (t === 'boolean') res[k] = false
          else if (t === 'json') res[k] = null
          else res[k] = ''
        }
        return res
      }

      const roots = importFromJSON(def.templateJson)
      const root = roots[0]
      if (!root) return

      // 实例化：为该次拖入生成全新的唯一 id（并修正内部 comp: 绑定引用）
      instantiateFromCustomComponentTemplate(root)

      root.custom = {
        defId: def.id,
        props: buildDefaultsFromSchema((def as any).propsSchema),
        state: buildDefaultsFromSchema((def as any).stateSchema)
      }

      if (hit) {
        const container = pageStore.getComponentById(hit.containerId)
        const layoutMode = (container?.props as any)?.layoutMode || 'manual'
        if (layoutMode === 'manual') {
          root.props.x = canvasPos.x - hit.x
          root.props.y = canvasPos.y - hit.y
        } else {
          root.props.x = 0
          root.props.y = 0
        }
        root.props.zIndex = 1
        emit('addToContainer', { containerId: hit.containerId, comp: root })
      } else {
        root.props.x = canvasPos.x
        root.props.y = canvasPos.y
        root.props.zIndex = getNextZIndex()
        emit('add', root)
      }

      dropIndicator.value.show = false
      dropIndicator.value.containerId = null
      return
    }
    if (hit) {
      const container = pageStore.getComponentById(hit.containerId)
      const layoutMode = (container?.props as any)?.layoutMode || 'manual'

      const newComp = createComp(componentType, `新建${componentType}`)
      if (layoutMode === 'manual') {
        newComp.props.x = canvasPos.x - hit.x
        newComp.props.y = canvasPos.y - hit.y
      } else {
        newComp.props.x = 0
        newComp.props.y = 0
      }
      newComp.props.zIndex = 1

      history.addAction({
        type: ActionType.ADD,
        componentId: newComp.id,
        data: {
          after: newComp,
          parentContainerId: hit.containerId
        } as any
      })

      emit('addToContainer', { containerId: hit.containerId, comp: newComp })
      dropIndicator.value.show = false
      dropIndicator.value.containerId = null
      return
    }

    // 创建新组件
    const newComp = createComp(componentType, `新建${componentType}`)
    newComp.props.x = canvasPos.x
    newComp.props.y = canvasPos.y
    newComp.props.zIndex = getNextZIndex() // 确保新组件有正确的zIndex

    // 记录添加操作
    history.addAction({
      type: ActionType.ADD,
      componentId: newComp.id,
      data: {
        after: newComp
      }
    })
    
    // 发出添加组件事件
    emit('add', newComp)

    dropIndicator.value.show = false
    dropIndicator.value.containerId = null
  }

  return {
    dropIndicator,
    dropIndicatorStyle,
    handleDragOver,
    handleDragLeave,
    handleDrop
  }
}
