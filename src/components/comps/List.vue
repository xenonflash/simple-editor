<template>
  <div class="list-component"
       ref="rootRef"
       :data-comp-id="props.id"
       :style="[containerStyle, autoLayoutStyle]"
       @mousedown.stop="onMouseDown"
       @click.stop>
    
    <!-- Empty State / Placeholder -->
    <div v-if="!listData || listData.length === 0" class="empty-list-placeholder">
       <span v-if="props.comp?.children?.length === 0">拖拽组件至此作为列表项模板</span>
       <span v-else>无数据 (绑定数据源以显示)</span>
    </div>

    <!-- Render List Items -->
    <template v-else>
       <div v-for="(item, index) in listData" 
            :key="index" 
            class="list-item-renderer"
            :style="itemStyle">
          <!-- Render Children for this item -->
          <template v-if="props.comp?.children?.length">
            <template v-for="child in props.comp.children" :key="child.id">
               <!-- Direct Child Rendering (No generic looping) -->
               <div class="child-wrapper" :style="{ zIndex: (child.props.zIndex || 1) }">
                 <ComponentRenderer
                   :comp="child"
                   :instanceId="`${child.id}__loop__${index}`"
                   :bindingContext="createItemContext(item, index)"
                   :scale="props.scale || 1"
                   :offsetX="0"
                   :offsetY="0"
                   :inFlowLayout="effectiveLayoutMode !== 'manual'"
                   :locked="lockedForChildren"
                   @update="onChildUpdate"
                 />
               </div>
            </template>
          </template>
       </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import type { Comp } from './base'
import { useDraggable } from '../../utils/dragHelper'
import { usePageStore } from '../../stores/page'
import { useEditorStore } from '../../stores/editor'
import { resolveBindingRef } from '../../utils/bindingRef'
import { useMeasuredSize } from '../../utils/useMeasuredSize'
import { COORDINATE_HELPER_KEY } from '../../utils/coordinateHelper'
import ComponentRenderer from './ComponentRenderer.vue'
import { createBindingResolver, mergeBindingContext } from '../../utils/renderLoop'

defineOptions({ name: 'List' })

const props = defineProps<{
  id: string
  comp: Comp
  width?: number
  height?: number
  x?: number
  y?: number
  scale?: number
  inFlowLayout?: boolean

  widthSizing?: 'fixed' | 'fill' | 'content'
  heightSizing?: 'fixed' | 'fill' | 'content'

  // List Properties
  dataSource?: string // binding ref
  layoutMode?: 'manual' | 'auto' // inherited/similar to container
  direction?: 'row' | 'column'
  gap?: number
  mockCount?: number
  
  // Standard Styles
  borderWidth?: number
  borderStyle?: string
  borderColor?: string
  borderRadiusTopLeft?: number
  borderRadiusTopRight?: number
  borderRadiusBottomLeft?: number
  borderRadiusBottomRight?: number
  shadowX?: number
  shadowY?: number
  shadowBlur?: number
  shadowSpread?: number
  shadowColor?: string
  shadowInset?: boolean
  background?: string
  backgroundColor?: string
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
}>()

const emit = defineEmits(['update'])
const pageStore = usePageStore()
const editorStore = useEditorStore()
const rootRef = ref<HTMLElement | null>(null)

// 1. Data Source Resolution
const listData = computed(() => {
  if (props.comp.props?.dataSource) {
     const resolved = resolveBindingRef(props.comp.props.dataSource, {
        getVarValue: (name) => pageStore.getVariableValue(name),
        getCompProp: (id, key) => pageStore.getComponentById(id)?.props?.[key],
        context: props.comp.bindingContext 
     })
     if (Array.isArray(resolved)) return resolved
  }
  
  // Mock Data if enabled or editor mode?
  // Build a simple mock array if no data
  const count = (typeof props.mockCount === 'number' && props.mockCount >= 0) ? props.mockCount : 3
  if (count <= 0) return []

  return Array.from({ length: count }, (_, i) => ({ 
    _mockIndex: i, 
    label: `Item ${i + 1}` 
  }))
})

function createItemContext(item: any, index: number) {
  return {
    ...(props.comp.bindingContext || {}),
    loop: { item, index }
  }
}

// 2. Style & Layout Logic (Borrowed from Container)
const effectiveLayoutMode = computed(() => 'auto') // List is always auto flow usually? Or support 'manual' inside items?
// Actually List itself lays out items. 'direction' controls item stacking.
// Items themselves can be manual or auto containers.

// Container Style (The List Box)
const containerStyle = computed(() => {
  const style: any = {
    position: props.inFlowLayout ? 'relative' : 'absolute',
    left: props.inFlowLayout ? 'auto' : `${props.x || 0}px`,
    top: props.inFlowLayout ? 'auto' : `${props.y || 0}px`,
    width: props.widthSizing === 'fill' ? '100%' : (props.widthSizing === 'content' ? 'fit-content' : (props.width ? `${props.width}px` : 'auto')),
    height: props.heightSizing === 'fill' ? '100%' : (props.heightSizing === 'content' ? 'fit-content' : (props.height ? `${props.height}px` : 'auto')),
    display: 'flex',
    flexDirection: props.direction || 'column',
    gap: `${props.gap || 0}px`,
    padding: `${props.paddingTop || 0}px ${props.paddingRight || 0}px ${props.paddingBottom || 0}px ${props.paddingLeft || 0}px`,
    margin: `${props.marginTop || 0}px ${props.marginRight || 0}px ${props.marginBottom || 0}px ${props.marginLeft || 0}px`,
    backgroundColor: props.backgroundColor,
    borderWidth: `${props.borderWidth || 0}px`,
    borderStyle: props.borderStyle || 'solid',
    borderColor: props.borderColor || 'transparent',
    boxShadow: (props.shadowX || props.shadowY || props.shadowBlur || props.shadowSpread) 
        ? `${props.shadowInset ? 'inset ' : ''}${props.shadowX || 0}px ${props.shadowY || 0}px ${props.shadowBlur || 0}px ${props.shadowSpread || 0}px ${props.shadowColor || '#000'}`
        : 'none',
     overflow: 'hidden' // Lists clip content usually
  }
  
  // Border Radius
  if (props.borderRadiusTopLeft) style.borderTopLeftRadius = `${props.borderRadiusTopLeft}px`
  if (props.borderRadiusTopRight) style.borderTopRightRadius = `${props.borderRadiusTopRight}px`
  if (props.borderRadiusBottomLeft) style.borderBottomLeftRadius = `${props.borderRadiusBottomLeft}px`
  if (props.borderRadiusBottomRight) style.borderBottomRightRadius = `${props.borderRadiusBottomRight}px`
  
  return style
})

const autoLayoutStyle = computed(() => ({
   alignItems: 'stretch', // Or from props
   justifyContent: 'flex-start',
   flexWrap: 'nowrap'
}))

// Item Style
const itemStyle = computed(() => ({
   position: 'relative', // Items establish coordinate system for absolute children
   flexShrink: 0,
   // If manual layout inside, we need size.
   // Typically list items auto-size or fixed height.
   minHeight: '40px',
   border: editorStore.isDesignMode ? '1px dashed rgba(0,0,0,0.1)' : 'none' // Guide lines only in design mode
}))

// 3. Selection & Dragging
const { handleMouseDown } = useDraggable({
  scale: computed(() => props.scale || 1),
  componentId: props.id,
  componentSize: computed(() => ({ width: props.width || 0, height: props.height || 0 })),
  onDragStart: () => {
     if (!pageStore.isComponentSelected(props.id)) {
        pageStore.selectComponent(props.id)
     }
  },
  onUpdate: (u) => emit('update', u)
})

function onMouseDown(e: MouseEvent) {
   handleMouseDown(e, props.x || 0, props.y || 0)
}

// 4. Child Updates
function onChildUpdate(payload: any) {
    if (payload.id && !payload.id.includes('__')) throw new Error("List child update ID mismatch")
    // If a child in a list changes, we're likely updating the Template (the Source Child)
    // payload.updates should be applied to the 'source' child comp definition
    const [sourceId, _idx] = payload.id.split('__')
    
    // Check if it's a layout update or prop update?
    // In strict list mode, children usually don't move X/Y if flow layout.
    // If manual layout inside item, they can move.
    
    pageStore.updateComponentUnsafe(sourceId, payload.updates)
}

const lockedForChildren = computed(() => false) // Allow editing children
</script>

<style scoped>
.list-component {
  box-sizing: border-box;
  user-select: none;
}
.empty-list-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
  font-size: 12px;
  width: 100%;
  height: 100%;
  padding: 20px;
  text-align: center;
}
.list-item-renderer {
    box-sizing: border-box;
}
</style>
