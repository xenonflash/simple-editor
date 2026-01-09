<template>
  <component
    v-if="resolvedComp"
    :is="resolvedComp"
    :id="instanceId"
    :comp="comp"
    v-bind="computedProps"
    :bindingContext="bindingContext"
    :scale="scale"
    :inFlowLayout="inFlowLayout"
    :locked="locked"
    v-on="eventHandlers"
    @update="handleUpdate"
    @contextmenu="handleContextMenu"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveComponent } from './componentRegistry'
import { getRenderedProps, createBindingResolver } from '@/utils/renderLoop'
import { useComponentEvents } from '@/runtime/useComponentEvents'
import type { Comp } from './base'

const props = defineProps<{
  comp: Comp
  instanceId: string
  bindingContext?: any
  scale?: number
  offsetX?: number
  offsetY?: number
  inFlowLayout?: boolean
  locked?: boolean
}>()

const emit = defineEmits<{
  (e: 'update', payload: { id: string; updates: any }): void
  (e: 'contextmenu', event: MouseEvent): void
}>()

const { eventHandlers } = useComponentEvents(props.comp)

const resolvedComp = computed(() => resolveComponent(props.comp.type))
const isNaive = computed(() => props.comp.type.startsWith('n-'))

const computedProps = computed(() => {
  // Naive components handle their own binding/props resolution internally
  if (isNaive.value) {
    return {}
  }

  // Standard components (Text, Button, Container) expect resolved props from parent
  const resolver = createBindingResolver(props.bindingContext)
  const rendered = getRenderedProps(props.comp, props.bindingContext, resolver)
  
  return {
    ...rendered,
    x: (rendered.x ?? 0) + (props.offsetX || 0),
    y: (rendered.y ?? 0) + (props.offsetY || 0)
  }
})

function handleUpdate(payload: any) {
  if (props.comp.type === 'container') {
    // Container emits { id, updates }
    emit('update', payload)
  } else {
    // Others emit updates
    emit('update', { id: props.instanceId, updates: payload })
  }
}

function handleContextMenu(event: MouseEvent) {
  emit('contextmenu', event)
}
</script>
