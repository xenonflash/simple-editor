<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { NButton } from 'naive-ui'
import LeftPanel from '../components/layout/LeftPanel.vue';
import PropertiesPanel from '../components/layout/PropertiesPanel.vue';
import Board from '../components/layout/Board.vue';
import FlowEditorModal from '../components/flow/FlowEditorModal.vue';
import { usePageStore } from '../stores/page';
import { useCustomComponentsStore } from '../stores/customComponents'
import type { Comp } from '../components/comps/base';
import type { PropSchema } from '../config/naive-ui-registry'

// 页面store
const pageStore = usePageStore();
const customComponentsStore = useCustomComponentsStore()

const isCustomEditMode = computed(() => pageStore.editorMode === 'custom-edit')
const editingCustomDefId = ref<string | null>(null)
const editingCustomDefName = ref<string | null>(null)
const editingCustomPropsSchema = ref<Record<string, PropSchema> | null>(null)
const editingCustomStateSchema = ref<Record<string, PropSchema> | null>(null)
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

  pageStore.setEditorMode('custom-edit')
  pageStore.createCustomComponentEditPage(def.id, def.name, def.templateJson)
}

function handleUpdateCustomPropsSchema(next: Record<string, PropSchema>) {
  editingCustomPropsSchema.value = next
}

function handleUpdateCustomStateSchema(next: Record<string, PropSchema>) {
  editingCustomStateSchema.value = next
}

function exitCustomEdit(save: boolean) {
  const defId = editingCustomDefId.value
  if (!defId) return

  const backTo = prevPageId.value

  if (save) {
    const templateJson = pageStore.exportCurrentPageComponentsToJSON()
    const schema = editingCustomPropsSchema.value || {}
    const stateSchema = editingCustomStateSchema.value || {}
    customComponentsStore.updateCustomComponent(defId, { templateJson, propsSchema: schema, stateSchema })
    pageStore.syncCustomComponentInstances({ id: defId, templateJson, propsSchema: schema })
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
      <LeftPanel
        :editingCustomDefName="editingCustomDefName"
        :editingCustomPropsSchema="editingCustomPropsSchema"
        :editingCustomStateSchema="editingCustomStateSchema"
        @update-custom-props-schema="handleUpdateCustomPropsSchema"
        @update-custom-state-schema="handleUpdateCustomStateSchema"
        @open-flow-editor="handleOpenFlowEditor"
        @edit-custom-component="handleEditCustomComponent"
      />
      <Board 
             :components="components"
              :bindingContext="customEditBindingContext"
             @select="handleSelect"
             @update="handleUpdate"
             @add="handleAddComponent"
              @addToContainer="handleAddComponentToContainer"
             @delete="handleDeleteComponent" />
      <PropertiesPanel :component="selectedComponent"
                      :editingCustomDefId="editingCustomDefId"
                      :editingCustomDefName="editingCustomDefName"
                      :editingCustomPropsSchema="editingCustomPropsSchema"
                      @update="handleUpdate"
                      @update-custom-props-schema="handleUpdateCustomPropsSchema"
                      @open-flow-editor="handleOpenFlowEditor" />
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
  display: flex;
  overflow: hidden;
  min-height: 0; /* 关键：允许flex子项收缩 */
}
</style>
