import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { PropSchema } from '../config/naive-ui-registry'

import type { EventSpec } from '../types/event'

export interface CustomComponentDef {
  id: string
  name: string
  templateJson: string
  propsSchema: Record<string, PropSchema>
  stateSchema: Record<string, PropSchema>
  eventsSchema?: Record<string, EventSpec>
  createdAt: number
  updatedAt: number
}

function newId(prefix = 'cc'): string {
  try {
    // modern browsers
    return `${prefix}_${crypto.randomUUID()}`
  } catch {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`
  }
}

export const useCustomComponentsStore = defineStore('customComponents', () => {
  const STORAGE_KEY = 'simple-editor:custom-components:v2'

  const defs = ref<CustomComponentDef[]>([])

  const byId = computed(() => {
    const map = new Map<string, CustomComponentDef>()
    for (const d of defs.value) map.set(d.id, d)
    return map
  })

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, defs: defs.value }))
    } catch (e) {
      console.warn('[customComponents] persist failed:', e)
    }
  }

  function initializeFromLocalStorage() {
    try {
      const rawV2 = localStorage.getItem(STORAGE_KEY)
      if (rawV2) {
        const parsed = JSON.parse(rawV2)
        if (!parsed || parsed.version !== 2 || !Array.isArray(parsed.defs)) return
        defs.value = parsed.defs.map((d: any) => {
          const stateSchema = (d && d.stateSchema && typeof d.stateSchema === 'object') ? d.stateSchema : {}
          return { ...d, stateSchema } as CustomComponentDef
        })
        return
      }

      // migrate from v1
      const rawV1 = localStorage.getItem('simple-editor:custom-components:v1')
      if (!rawV1) return
      const parsedV1 = JSON.parse(rawV1)
      if (!parsedV1 || parsedV1.version !== 1 || !Array.isArray(parsedV1.defs)) return

      defs.value = parsedV1.defs.map((d: any) => {
        const now = Date.now()
        return {
          id: String(d.id),
          name: String(d.name || '自定义组件'),
          templateJson: String(d.templateJson || '[]'),
          propsSchema: {},
          stateSchema: {},
          createdAt: Number(d.createdAt) || now,
          updatedAt: now
        } satisfies CustomComponentDef
      })
      persist()
    } catch (e) {
      console.warn('[customComponents] init failed:', e)
    }
  }

  function addCustomComponent(name: string, templateJson: string): CustomComponentDef {
    const now = Date.now()
    const def: CustomComponentDef = {
      id: newId(),
      name: name.trim() || '自定义组件',
      templateJson,
      propsSchema: {},
      stateSchema: {},
      createdAt: now,
      updatedAt: now
    }
    defs.value = [def, ...defs.value]
    persist()
    return def
  }

  function updateCustomComponent(id: string, patch: Partial<Pick<CustomComponentDef, 'name' | 'templateJson' | 'propsSchema' | 'stateSchema'>>): boolean {
    const idx = defs.value.findIndex((d) => d.id === id)
    if (idx < 0) return false
    const cur = defs.value[idx]
    const next: CustomComponentDef = {
      ...cur,
      ...patch,
      updatedAt: Date.now()
    }
    const copy = [...defs.value]
    copy[idx] = next
    defs.value = copy
    persist()
    return true
  }

  function getById(id: string): CustomComponentDef | undefined {
    return byId.value.get(id)
  }

  function deleteCustomComponent(id: string): boolean {
    const idx = defs.value.findIndex((d) => d.id === id)
    if (idx < 0) return false
    const copy = [...defs.value]
    copy.splice(idx, 1)
    defs.value = copy
    persist()
    return true
  }

  return {
    defs,
    initializeFromLocalStorage,
    addCustomComponent,
    getById,
    updateCustomComponent,
    deleteCustomComponent
  }
})
