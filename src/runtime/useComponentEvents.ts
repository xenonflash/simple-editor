import { computed, onMounted, onUnmounted } from 'vue'
import { useMessage } from 'naive-ui'
import { useEditorStore } from '@/stores/editor'
import { useEventRunner } from '@/utils/eventRunner'
import { useFlowRunner } from '@/utils/flowRunner'
import type { Comp, CompEvent } from '@/components/comps/base'

export function useComponentEvents(comp: Comp) {
  const editorStore = useEditorStore()
  const { runEvents, setMessageApi: setRunnerMsg } = useEventRunner()
  const { executeFlow, setMessageApi: setFlowMsg } = useFlowRunner()
  const message = useMessage()

  // Initialize message APIs
  setRunnerMsg(message)
  setFlowMsg(message)

  function handleEventTrigger(eventName: string, args: any) {
    if (editorStore.isDesignMode) return

    const eventsList = comp.events?.[eventName]
    if (!eventsList || !eventsList.length) return
    
    eventsList.forEach((handler: CompEvent) => {
        // Trigger check (optional, but good for safety)
        if (handler.trigger !== eventName) return 

        if (handler.flowId) {
            executeFlow(handler.flowId, { event: args, componentId: comp.id })
        }
        
        if (handler.actions && handler.actions.length > 0) {
            runEvents(handler.actions, { componentId: comp.id, executeFlow })
        }
    })
  }

  const eventHandlers = computed(() => {
     if (editorStore.isDesignMode) return {}

     const handlers: Record<string, Function> = {}
     
     if (!comp.events) return {}

     Object.keys(comp.events).forEach(eventName => {
         // Lifecycle events are handled by hooks, not via v-on
         if (['mounted', 'unmounted'].includes(eventName)) return
         
         handlers[eventName] = (payload: any) => {
             handleEventTrigger(eventName, payload)
         }
     })
     
     return handlers
  })

  // Lifecycle events
  onMounted(() => {
      if (comp.events?.mounted) {
          handleEventTrigger('mounted', null)
      }
  })

  onUnmounted(() => {
      if (comp.events?.unmounted) {
           handleEventTrigger('unmounted', null)
      }
  })

  return { eventHandlers }
}
