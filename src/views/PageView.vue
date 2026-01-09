<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { NButton } from 'naive-ui'
import LeftPanel from '../components/layout/LeftPanel.vue';
import PropertiesPanel from '../components/layout/PropertiesPanel.vue';
import Board from '../components/layout/Board.vue';
import FlowEditorModal from '../components/flow/FlowEditorModal.vue';
import { usePageStore } from '../stores/page';
import { useCustomComponentsStore } from '../stores/customComponents'
import { useEditorStore } from '../stores/editor'
import type { Comp } from '../components/comps/base';
import type { PropSchema } from '../config/naive-ui-registry'
import type { EventSpec } from '../types/event'

// 页面store
const pageStore = usePageStore();
const customComponentsStore = useCustomComponentsStore()
const editorStore = useEditorStore()

const isCustomEditMode = computed(() => pageStore.editorMode === 'custom-edit')
const editingCustomDefId = ref<string | null>(null)
const editingCustomDefName = ref<string | null>(null)
const editingCustomPropsSchema = ref<Record<string, PropSchema> | null>(null)
const editingCustomStateSchema = ref<Record<string, PropSchema> | null>(null)
const editingCustomEventsSchema = ref<Record<string, EventSpec> | null>(null)
const prevPageId = ref<string | null>(null)

function buildDefaultsFromSchema(schema: Record<string, PropSchema> | null): Record<string, any> {
  const res: Record<string, any> = {}
  const src = schema || {}
  for (const [k, s] of Object.entries(src)) {
    const ss: any = s
    if (ss && Object.prototype.hasOwnProperty.call(ss, 'default')) {
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

const customEditBindingContext = computed(() => {
  if (!isCustomEditMode.value) return undefined
  return {
    props: buildDefaultsFromSchema(editingCustomPropsSchema.value),
    state: buildDefaultsFromSchema(editingCustomStateSchema.value)
  }
})

// Flow 编辑器状态
const showFlowEditor = ref(false);
const currentFlowId = ref<string | null>(null);

function handleOpenFlowEditor(flowId?: string) {
  currentFlowId.value = flowId || null;
  showFlowEditor.value = true;
}

// 计算属性 - 直接从 store 获取
const components = computed(() => pageStore.currentComponents);
const selectedComponent = computed(() => pageStore.primarySelectedComp);

// 初始化
onMounted(() => {
  pageStore.initializeFromLocalStorage();
  customComponentsStore.initializeFromLocalStorage()
  pageStore.startAutoPersist({ intervalMs: 5000 });
});

onUnmounted(() => {
  pageStore.stopAutoPersist();
});

// 处理组件选中
function handleSelect(id: string | null) {
  console.log('Selected component:', id);
  pageStore.selectComponent(id);
}

function handleEditCustomComponent(defId: string) {
  const def = customComponentsStore.getById(defId)
  if (!def) return

  prevPageId.value = pageStore.currentPageId
  editingCustomDefId.value = def.id
  editingCustomDefName.value = def.name
  editingCustomPropsSchema.value = { ...(def.propsSchema || {}) }
  editingCustomStateSchema.value = { ...(def.stateSchema || {}) }
  editingCustomEventsSchema.value = { ...(def.eventsSchema || {}) }

  pageStore.setEditorMode('custom-edit')
  pageStore.createCustomComponentEditPage(def.id, def.name, def.templateJson)
}

function handleUpdateCustomPropsSchema(next: Record<string, PropSchema>) {
  editingCustomPropsSchema.value = next
}

function handleUpdateCustomStateSchema(next: Record<string, PropSchema>) {
  editingCustomStateSchema.value = next
}

function handleUpdateCustomEventsSchema(next: Record<string, EventSpec>) {
  editingCustomEventsSchema.value = next
}

function exitCustomEdit(save: boolean) {
  const defId = editingCustomDefId.value
  if (!defId) return

  const backTo = prevPageId.value

  if (save) {
    const templateJson = pageStore.exportCurrentPageComponentsToJSON()
    const schema = editingCustomPropsSchema.value || {}
    const stateSchema = editingCustomStateSchema.value || {}
    const eventsSchema = editingCustomEventsSchema.value || {}
    customComponentsStore.updateCustomComponent(defId, { templateJson, propsSchema: schema, stateSchema, eventsSchema })
    pageStore.syncCustomComponentInstances({ id: defId, templateJson, propsSchema: schema, stateSchema }) // Sync instance doesn't strictly need eventsSchema yet but good to check
  }

  pageStore.removeCustomComponentEditPage(defId)
  pageStore.setEditorMode('page')
  if (backTo) pageStore.switchPage(backTo)

  editingCustomDefId.value = null
  editingCustomDefName.value = null
  editingCustomPropsSchema.value = null
  editingCustomStateSchema.value = null
  prevPageId.value = null
}

// 处理组件更新
function handleUpdate(compOrComps: Comp | Comp[]) {
  if (Array.isArray(compOrComps)) {
    pageStore.updateCurrentPageComponents(compOrComps);
  } else {
    pageStore.updateComponentInCurrentPage(compOrComps);
  }
}

// 处理添加组件
function handleAddComponent(comp: Comp) {
  console.log('Add component:', comp);
  pageStore.addComponentToCurrentPage(comp);
  pageStore.selectComponent(comp.id);
}

function handleAddComponentToContainer(payload: { containerId: string; comp: Comp }) {
  const ok = pageStore.addComponentToContainer(payload.containerId, payload.comp);
  if (ok) {
    pageStore.selectComponent(payload.comp.id);
  } else {
    // fallback: 如果容器不存在，退化为添加到顶层
    pageStore.addComponentToCurrentPage(payload.comp);
    pageStore.selectComponent(payload.comp.id);
  }
}

// 处理删除组件
function handleDeleteComponent(id: string) {
  console.log('Delete component:', id);
  pageStore.deleteComponentFromCurrentPage(id);
}
</script>

<template>
  <div class="editor-container">
    <div v-if="isCustomEditMode" class="edit-mode-bar">
      <div class="edit-title">正在编辑组件：{{ editingCustomDefName || editingCustomDefId }}</div>
      <div class="edit-actions">
        <NButton size="small" @click="exitCustomEdit(false)">返回页面</NButton>
        <NButton size="small" type="primary" @click="exitCustomEdit(true)">保存并同步</NButton>
      </div>
    </div>
    <div class="main">
      <div class="board-layer">
        <Board 
               :components="components"
               :bindingContext="customEditBindingContext"
               @select="handleSelect"
               @update="handleUpdate"
               @add="handleAddComponent"
               @addToContainer="handleAddComponentToContainer"
               @delete="handleDeleteComponent" />
      </div>
      <div class="panel-wrapper left-panel-wrapper" :class="{ hidden: editorStore.isPreviewMode }">
        <LeftPanel
          :editingCustomDefName="editingCustomDefName"
          :editingCustomPropsSchema="editingCustomPropsSchema"
          :editingCustomStateSchema="editingCustomStateSchema"
          :editingCustomEventsSchema="editingCustomEventsSchema"
          @update-custom-props-schema="handleUpdateCustomPropsSchema"
          @update-custom-state-schema="handleUpdateCustomStateSchema"
          @update-custom-events-schema="handleUpdateCustomEventsSchema"
          @open-flow-editor="handleOpenFlowEditor"
          @edit-custom-component="handleEditCustomComponent"
        />
      </div>
      <div class="panel-wrapper right-panel-wrapper" :class="{ hidden: editorStore.isPreviewMode }">
        <PropertiesPanel :component="selectedComponent"
                      :editingCustomDefId="editingCustomDefId"
                      :editingCustomDefName="editingCustomDefName"
                      :editingCustomPropsSchema="editingCustomPropsSchema"
                      :editingCustomEventsSchema="editingCustomEventsSchema"
                      @update="handleUpdate"
                      @update-custom-props-schema="handleUpdateCustomPropsSchema"
                      @open-flow-editor="handleOpenFlowEditor" />
      </div>
    </div>
    
    <FlowEditorModal 
      v-model:show="showFlowEditor" 
      :flowId="currentFlowId" 
    />
  </div>
</template>

<style scoped>
.editor-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 关键：防止整个容器滚动 */
}

.edit-mode-bar {
  height: 40px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid #e5e5e5;
  background: #ffffff;
}

.edit-title {
  font-size: 12px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.main {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: block;
}

.board-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.panel-wrapper {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 10;
  background: white;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 12px rgba(0,0,0,0.1);
}

.panel-wrapper.left-panel-wrapper {
  left: 0;
  width: 300px;
  border-right: 1px solid #e5e5e5;
  transform: translateX(0);
}

.panel-wrapper.right-panel-wrapper {
  right: 0;
  width: 240px;
  border-left: 1px solid #e5e5e5;
  transform: translateX(0);
}

.panel-wrapper.hidden {
  pointer-events: none;
}

.panel-wrapper.left-panel-wrapper.hidden {
  transform: translateX(-100%);
}

.panel-wrapper.right-panel-wrapper.hidden {
  transform: translateX(100%);
}
</style>
