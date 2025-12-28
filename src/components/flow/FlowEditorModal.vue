<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NModal, NCard, NButton, NList, NListItem, NInput, NSpace, NIcon, NForm, NFormItem, NSelect, useMessage } from 'naive-ui'
import { Add, Trash, Play, GitNetwork, Close, Save } from '@vicons/ionicons5'
import FlowCanvas from './FlowCanvas.vue'
import { usePageStore } from '../../stores/page'
import type { PageFlow } from '../../types/page'
import { actionRegistry } from '../../config/actions'

const props = defineProps<{
  show: boolean
  flowId?: string | null
}>()

const emit = defineEmits(['update:show'])

const message = useMessage()
const pageStore = usePageStore()
const currentPage = computed(() => pageStore.currentPage)
const flows = computed(() => currentPage.value?.flows || [])

const selectedFlowId = ref<string | null>(null)
const selectedFlowRaw = computed(() => flows.value.find(f => f.id === selectedFlowId.value))

const selectedFlow = computed(() => {
  if (!selectedFlowRaw.value) return null
  return {
    ...selectedFlowRaw.value,
    nodes: selectedFlowRaw.value.nodes.map(n => ({
      ...n,
      deletable: n.type !== 'logicStart'
    }))
  }
})

watch(() => props.flowId, (newId) => {
  selectedFlowId.value = newId || null
}, { immediate: true })

const variableOptions = computed(() => {
  return (pageStore.currentPage?.variables || []).map(v => ({ label: v.name, value: v.name }));
});

const actionTypeOptions = actionRegistry.map(a => ({ label: a.label, value: a.type }));

function updatePageFlows(newFlows: PageFlow[]) {
  if (!currentPage.value) return
  pageStore.updatePageProperties(currentPage.value.id, { flows: newFlows })
}

// Flow Canvas 事件处理
const selectedNode = ref<any>(null)

function handleNodeSelect(node: any) {
  selectedNode.value = node
}

function updateNodeData(key: string, value: any) {
  if (!selectedNode.value) return
  const newData = { ...selectedNode.value.data, [key]: value }
  // Update local state (shallow copy to trigger reactivity if needed)
  selectedNode.value = { ...selectedNode.value, data: newData }
  // Update flow
  handleUpdateNode(selectedNode.value.id, { data: newData })
}

function updateNodeParam(key: string, value: any) {
  if (!selectedNode.value) return
  const currentParams = selectedNode.value.data.params || {}
  const newParams = { ...currentParams, [key]: value }
  updateNodeData('params', newParams)
}

function handleSave() {
  message.success('保存成功')
}

function handleAddEdge(params: any) {
  if (!selectedFlow.value) return
  const newEdge = {
    ...params,
    id: `e-${params.source}-${params.target}-${Date.now()}`
  }
  const newEdges = [...selectedFlow.value.edges, newEdge]
  updateCurrentFlow({ edges: newEdges })
}

function handleAddNode(node: any) {
  if (!selectedFlow.value) return
  const newNodes = [...selectedFlow.value.nodes, node]
  updateCurrentFlow({ nodes: newNodes })
}

function handleUpdateNode(nodeId: string, updates: any) {
  if (!selectedFlow.value) return
  const newNodes = selectedFlow.value.nodes.map(n => 
    n.id === nodeId ? { ...n, ...updates, position: updates.position || n.position } : n
  )
  updateCurrentFlow({ nodes: newNodes })
}

function handleNodesChange(changes: any[]) {
  if (!selectedFlow.value) return
  
  // 处理节点删除
  const removals = changes.filter(c => c.type === 'remove')
  if (removals.length > 0) {
    const removedIds = removals.map(c => c.id)
    
    // 过滤掉开始节点，不允许删除
    const nodesToDelete = selectedFlow.value.nodes.filter(n => removedIds.includes(n.id))
    const validRemovals = nodesToDelete.filter(n => n.type !== 'logicStart')
    const validRemovedIds = validRemovals.map(n => n.id)
    
    if (validRemovedIds.length === 0) return

    const newNodes = selectedFlow.value.nodes.filter(n => !validRemovedIds.includes(n.id))
    // 同时删除相关的边
    const newEdges = selectedFlow.value.edges.filter(e => !validRemovedIds.includes(e.source) && !validRemovedIds.includes(e.target))
    
    updateCurrentFlow({ nodes: newNodes, edges: newEdges })
    
    // 如果选中的节点被删除了，取消选中
    if (selectedNode.value && validRemovedIds.includes(selectedNode.value.id)) {
      selectedNode.value = null
    }
  }
}

function updateCurrentFlow(updates: Partial<PageFlow>) {
  if (!selectedFlow.value) return
  const updatedFlow = { ...selectedFlow.value, ...updates }
  const updatedFlows = flows.value.map(f => f.id === updatedFlow.id ? updatedFlow : f)
  updatePageFlows(updatedFlows)
}

// 拖拽添加节点
function onDragStart(event: DragEvent, nodeType: string, actionType?: string) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify({
      type: nodeType,
      actionType
    }))
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onDrop(event: DragEvent) {
  // FlowCanvas 处理了 drop 吗？我们需要在 FlowCanvas 中暴露 drop 区域或者在这里处理
  // 这里简化处理，假设 FlowCanvas 内部处理了 drop 或者我们需要传递给它
  // 实际上 VueFlow 的 onDrop 需要在 FlowCanvas 内部处理
}

// 这里的 onDrop 逻辑其实应该在 FlowCanvas 内部，或者 FlowCanvas 暴露 drop 事件
// 我们先在 FlowCanvas 增加 drop 支持
</script>

<template>
  <n-modal :show="show" @update:show="emit('update:show', $event)" style="width: 90vw; height: 90vh">
    <n-card title="逻辑编排" :bordered="false" size="small" role="dialog" aria-modal="true" style="height: 100%">
      <template #header-extra>
        <n-space>
          <n-button size="small" type="primary" @click="handleSave">
            <template #icon><n-icon><Save /></n-icon></template>
            保存
          </n-button>
          <n-button size="small" @click="emit('update:show', false)">
            <template #icon><n-icon><Close /></n-icon></template>
          </n-button>
        </n-space>
      </template>
      <div class="flow-editor-layout">
        <!-- 左侧：节点工具箱 -->
        <div class="sidebar toolbox-panel" v-if="selectedFlow">
          <div class="panel-header">
            <span>节点工具箱</span>
          </div>
          <div class="panel-content">
            <div class="node-category">
              <div class="category-title">基础节点</div>
              <div class="node-item" draggable="true" @dragstart="onDragStart($event, 'logicCondition')">
                <div class="node-preview condition">◇</div>
                <span>条件判断</span>
              </div>
            </div>
            
            <div class="node-category">
              <div class="category-title">动作节点</div>
              <div class="node-item" draggable="true" @dragstart="onDragStart($event, 'logicAction', 'setVar')">
                <div class="node-preview action">V</div>
                <span>变量操作</span>
              </div>
              <div class="node-item" draggable="true" @dragstart="onDragStart($event, 'logicAction', 'toast')">
                <div class="node-preview action">T</div>
                <span>消息提示</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间：画布 -->
        <div class="canvas-area">
          <div v-if="selectedFlow" class="flow-canvas-wrapper">
            <FlowCanvas 
              :nodes="selectedFlow.nodes" 
              :edges="selectedFlow.edges"
              @nodeSelect="handleNodeSelect"
              @addEdge="handleAddEdge"
              @addNode="handleAddNode"
              @updateNode="handleUpdateNode"
              @nodesChange="handleNodesChange"
            />
          </div>
          <div v-else class="empty-state">
            请选择或创建一个逻辑流
          </div>
        </div>

        <!-- 右侧：属性面板 -->
        <div class="sidebar property-panel" v-if="selectedNode">
          <div class="panel-header" style="display: flex; justify-content: space-between; align-items: center;">
            <span>节点属性</span>
            <n-button size="tiny" quaternary circle @click="selectedNode = null">
              <template #icon><n-icon><Close /></n-icon></template>
            </n-button>
          </div>
          <div class="panel-content">
            <n-form size="small" label-placement="top">
              <n-form-item label="节点名称">
                <n-input :value="selectedNode.data.label" @update:value="v => updateNodeData('label', v)" />
              </n-form-item>

              <!-- 动作节点配置 -->
              <template v-if="selectedNode.type === 'logicAction'">
                <template v-if="selectedNode.data.actionType === 'setVar' || selectedNode.data.actionType === 'pushVar'">
                    <n-form-item label="操作类型">
                      <n-select :value="selectedNode.data.actionType" 
                                :options="[{label: '设置变量', value: 'setVar'}, {label: '追加变量', value: 'pushVar'}]" 
                                @update:value="v => updateNodeData('actionType', v)" />
                    </n-form-item>
                  <n-form-item label="目标变量">
                    <n-select :value="selectedNode.data.params?.variableName" :options="variableOptions" @update:value="v => updateNodeParam('variableName', v)" />
                  </n-form-item>
                  <n-form-item label="值">
                    <n-input :value="selectedNode.data.params?.value" @update:value="v => updateNodeParam('value', v)" />
                  </n-form-item>
                </template>

                <template v-if="selectedNode.data.actionType === 'toast'">
                  <n-form-item label="消息内容">
                    <n-input :value="selectedNode.data.params?.content" @update:value="v => updateNodeParam('content', v)" />
                  </n-form-item>
                  <n-form-item label="类型">
                    <n-select :value="selectedNode.data.params?.type" :options="[{label:'Info',value:'info'},{label:'Success',value:'success'},{label:'Warning',value:'warning'},{label:'Error',value:'error'}]" @update:value="v => updateNodeParam('type', v)" />
                  </n-form-item>
                </template>
              </template>

              <!-- 条件节点配置 -->
              <template v-if="selectedNode.type === 'logicCondition'">
                <n-form-item label="条件表达式">
                  <n-input type="textarea" :value="selectedNode.data.expression" @update:value="v => updateNodeData('expression', v)" placeholder="例如: var1 > 10" />
                </n-form-item>
              </template>
            </n-form>
          </div>
        </div>
      </div>
    </n-card>
  </n-modal>
</template>

<style scoped>
.flow-editor-layout {
  display: flex;
  height: calc(90vh - 60px); /* 减去 modal header */
  border: 1px solid #eee;
}

.sidebar {
  width: 250px;
  background: #f9f9f9;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.toolbox-panel {
  border-right: none;
  border-left: 1px solid #eee;
}

.panel-header {
  padding: 12px;
  font-weight: bold;
  border-bottom: 1px solid #eee;
  background: #fff;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.canvas-area {
  flex: 1;
  background: #f0f2f5;
  position: relative;
}

.flow-canvas-wrapper {
  width: 100%;
  height: 100%;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.add-flow {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.flow-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flow-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.active {
  background-color: #e6f7ff;
  color: #1890ff;
}

/* 工具箱样式 */
.node-category {
  margin-bottom: 16px;
}

.category-title {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: grab;
  transition: all 0.2s;
}

.node-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.node-preview {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.node-preview.condition {
  background: #fffbe6;
  color: #faad14;
  border: 1px solid #ffe58f;
  transform: rotate(45deg) scale(0.8);
}

.node-preview.action {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}
</style>
