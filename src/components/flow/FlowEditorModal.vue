<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NModal, NCard, NButton, NList, NListItem, NInput, NInputNumber, NSpace, NIcon, NForm, NFormItem, NSelect, NTag, useMessage } from 'naive-ui'
import { Add, Trash, Play, GitNetwork, Close, Save } from '@vicons/ionicons5'
import FlowCanvas from './FlowCanvas.vue'
import ScriptCodeEditor from './ScriptCodeEditor.vue'
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
const actionLabelMap = computed(() => actionRegistry.reduce((acc, cur) => { acc[cur.type] = cur.label; return acc; }, {} as Record<string, string>));
const flowOptions = computed(() => (flows.value || []).map(f => ({ label: f.name, value: f.id })));

const defaultScriptTemplate = `/**
 * 函数节点（Coder Mode）
 *
 * 可用对象：
 * - context: 运行上下文（会在节点间传递）
 *   - context.prevResult: 上一个节点的输出（若存在）
 *   - context.lastError: 上一个节点的错误（若存在）
 * - event: 事件对象（若存在）
 * - pageStore: 页面变量读写（getVariableValue / updateVariableValue）
 * - messageApi: 提示（info/success/warning/error）
 * - fetch: 网络请求
 *
 * 输出流转：
 * - 正常执行：走「成功」连线
 * - throw/异常：走「失败」连线
 */

// 提示：你可以直接 return 值，后续节点用 context.prevResult 读取
// 也可以用 pageStore.updateVariableValue 写回页面变量

const input = context?.input

// TODO: 在这里编写你的逻辑
return { input }
`;

const scriptCodeModel = computed<string>({
  get() {
    if (selectedNode.value?.type !== 'logicAction') return ''
    if (selectedNode.value?.data?.actionType !== 'script') return ''
    return selectedNode.value?.data?.params?.code || ''
  },
  set(v: string) {
    if (selectedNode.value?.type !== 'logicAction') return
    if (selectedNode.value?.data?.actionType !== 'script') return
    updateNodeParam('code', v)
  }
})


const variableTree = computed(() => {
  const pageVars = (pageStore.currentPage?.variables || []).map((v) => ({
    label: `${v.name} (${v.type})`,
    key: `page-${v.name}`,
    isLeaf: true,
    desc: '页面变量',
    snippet: `pageStore.getVariableValue('${v.name}')`
  }));

  const globals: any[] = [
    {
      label: 'messageApi',
      key: 'global-messageApi',
      isLeaf: true,
      desc: '提示 API',
      snippet: 'messageApi.success("提示内容")'
    },
    {
      label: 'fetch',
      key: 'global-fetch',
      isLeaf: true,
      desc: '网络请求',
      snippet: 'const res = await fetch("https://api.example.com")'
    }
  ];

  const ctxNodes: any[] = [
    { label: 'context.input', key: 'ctx-input', isLeaf: true, desc: '节点入参', snippet: 'context.input' },
    { label: 'context.prevResult', key: 'ctx-prev', isLeaf: true, desc: '上个节点输出', snippet: 'context.prevResult' },
    { label: 'context.lastError', key: 'ctx-err', isLeaf: true, desc: '上个节点错误', snippet: 'context.lastError' },
    { label: 'context.__flowId', key: 'ctx-flow', isLeaf: true, desc: '当前 Flow 标识', snippet: 'context.__flowId' },
    { label: 'event', key: 'ctx-event', isLeaf: true, desc: '事件对象（若存在）', snippet: 'event' }
  ];

  return [
    { label: '页面变量', key: 'page-vars', children: pageVars },
    { label: '全局能力', key: 'global', children: globals },
    { label: '上下文', key: 'context', children: ctxNodes }
  ];
});

function updatePageFlows(newFlows: PageFlow[]) {
  if (!currentPage.value) return
  pageStore.updatePageProperties(currentPage.value.id, { flows: newFlows })
}

// Flow Canvas 事件处理
const selectedNode = ref<any>(null)

function handleNodeSelect(node: any) {
  selectedNode.value = node

  // 选中脚本节点时：若为空，自动填充默认模板（避免空白编辑器）
  if (node?.type === 'logicAction' && node?.data?.actionType === 'script') {
    const code = node?.data?.params?.code
    if (!code || !String(code).trim()) {
      updateNodeParam('code', defaultScriptTemplate)
    }
  }
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
function onDragStart(event: DragEvent, nodeType: string, actionType?: string, name?: string, params?: Record<string, any>) {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify({
      type: nodeType,
      actionType,
      name,
      params
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
              <div class="node-item" draggable="true" @dragstart="onDragStart($event, 'logicAction', 'setVar', '变量操作')">
                <div class="node-preview action">V</div>
                <span>变量操作</span>
              </div>
              <div class="node-item" draggable="true" @dragstart="onDragStart($event, 'logicAction', 'toast', '消息提示')">
                <div class="node-preview action">T</div>
                <span>消息提示</span>
              </div>
              <div class="node-item" draggable="true" @dragstart="onDragStart($event, 'logicAction', 'script', '函数执行', { code: defaultScriptTemplate })">
                <div class="node-preview action">F</div>
                <span>函数执行</span>
              </div>
              <div class="node-item" draggable="true" @dragstart="onDragStart($event, 'logicAction', 'httpRequest', 'HTTP 请求', { method: 'GET' })">
                <div class="node-preview action">H</div>
                <span>HTTP 请求</span>
              </div>
              <div class="node-item" draggable="true" @dragstart="onDragStart($event, 'logicAction', 'sendEmail', '发送邮件')">
                <div class="node-preview action">M</div>
                <span>发送邮件</span>
              </div>
              <div class="node-item" draggable="true" @dragstart="onDragStart($event, 'logicAction', 'executeFlow', '执行 Flow')">
                <div class="node-preview action">↻</div>
                <span>执行 Flow</span>
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
                <n-form-item label="动作类型">
                  <div class="action-type-row">
                    <NTag type="info" size="small">{{ actionLabelMap[selectedNode.data.actionType] || selectedNode.data.actionType }}</NTag>
                  </div>
                </n-form-item>

                <template v-if="selectedNode.data.actionType === 'setVar' || selectedNode.data.actionType === 'pushVar' || selectedNode.data.actionType === 'removeVar'">
                  <n-form-item label="目标变量">
                    <n-select :value="selectedNode.data.params?.variableName" :options="variableOptions" @update:value="v => updateNodeParam('variableName', v)" />
                  </n-form-item>
                  <n-form-item v-if="selectedNode.data.actionType !== 'removeVar'" label="值">
                    <n-space vertical size="small" style="width: 100%;">
                      <n-select
                        :value="selectedNode.data.params?.valueSource || 'literal'"
                        :options="[
                          { label: '固定值', value: 'literal' },
                          { label: '上个节点输出 (context.prevResult)', value: 'prevResult' },
                          { label: '上个节点错误 (context.lastError)', value: 'lastError' }
                        ]"
                        @update:value="v => updateNodeParam('valueSource', v)"
                      />
                      <n-input
                        v-if="(selectedNode.data.params?.valueSource || 'literal') === 'literal'"
                        :value="selectedNode.data.params?.value"
                        placeholder="固定值（字符串/JSON 由节点自身处理）"
                        @update:value="v => updateNodeParam('value', v)"
                      />
                    </n-space>
                  </n-form-item>
                  <n-form-item v-if="selectedNode.data.actionType === 'removeVar'" label="索引">
                    <n-input-number :value="selectedNode.data.params?.index" @update:value="v => updateNodeParam('index', Number(v))" />
                  </n-form-item>
                </template>

                <template v-else-if="selectedNode.data.actionType === 'toast'">
                  <n-form-item label="消息内容">
                    <n-input :value="selectedNode.data.params?.content" @update:value="v => updateNodeParam('content', v)" />
                  </n-form-item>
                  <n-form-item label="类型">
                    <n-select :value="selectedNode.data.params?.type" :options="[{label:'Info',value:'info'},{label:'Success',value:'success'},{label:'Warning',value:'warning'},{label:'Error',value:'error'}]" @update:value="v => updateNodeParam('type', v)" />
                  </n-form-item>
                </template>

                <template v-else-if="selectedNode.data.actionType === 'script'">
                  <n-form-item label="JS 代码">
                    <ScriptCodeEditor v-model="scriptCodeModel" :variable-tree="variableTree" />
                  </n-form-item>
                </template>

                <template v-else-if="selectedNode.data.actionType === 'httpRequest'">
                  <n-form-item label="URL">
                    <n-input :value="selectedNode.data.params?.url" placeholder="https://api.example.com" @update:value="v => updateNodeParam('url', v)" />
                  </n-form-item>
                  <n-form-item label="方法">
                    <n-select :value="selectedNode.data.params?.method || 'GET'" :options="[
                      {label:'GET',value:'GET'},
                      {label:'POST',value:'POST'},
                      {label:'PUT',value:'PUT'},
                      {label:'PATCH',value:'PATCH'},
                      {label:'DELETE',value:'DELETE'}
                    ]" @update:value="v => updateNodeParam('method', v)" />
                  </n-form-item>
                  <n-form-item label="Headers (JSON)">
                    <n-input type="textarea" :value="selectedNode.data.params?.headers" @update:value="v => updateNodeParam('headers', v)" />
                  </n-form-item>
                  <n-form-item label="Body (JSON)">
                    <n-input type="textarea" :value="selectedNode.data.params?.body" @update:value="v => updateNodeParam('body', v)" />
                  </n-form-item>
                  <n-form-item label="保存到变量">
                    <n-select :value="selectedNode.data.params?.targetVar" :options="variableOptions" @update:value="v => updateNodeParam('targetVar', v)" />
                  </n-form-item>
                </template>

                <template v-else-if="selectedNode.data.actionType === 'sendEmail'">
                  <n-form-item label="收件人">
                    <n-input :value="selectedNode.data.params?.to" @update:value="v => updateNodeParam('to', v)" />
                  </n-form-item>
                  <n-form-item label="主题">
                    <n-input :value="selectedNode.data.params?.subject" @update:value="v => updateNodeParam('subject', v)" />
                  </n-form-item>
                  <n-form-item label="正文">
                    <n-input type="textarea" :value="selectedNode.data.params?.body" @update:value="v => updateNodeParam('body', v)" />
                  </n-form-item>
                </template>

                <template v-else-if="selectedNode.data.actionType === 'executeFlow'">
                  <n-form-item label="目标 Flow">
                    <n-select :value="selectedNode.data.params?.flowId" :options="flowOptions" @update:value="v => updateNodeParam('flowId', v)" />
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
  height: calc(90vh - 60px);
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
