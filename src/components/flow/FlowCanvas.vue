<script setup lang="ts">
import { ref } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { Background } from '@vue-flow/background'
import CustomNode from './nodes/CustomNode.vue'
import FormNode from './nodes/FormNode.vue'
import LogicStartNode from './nodes/LogicStartNode.vue'
import LogicActionNode from './nodes/LogicActionNode.vue'
import LogicConditionNode from './nodes/LogicConditionNode.vue'
import type { NodeTypesObject } from '@vue-flow/core'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

interface Props {
  nodes: any[]
  edges: any[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  nodeSelect: [node: any]
  edgeSelect: [edge: any]
  addEdge: [edge: any]
  updateNode: [nodeId: string, updates: any]
  addNode: [nodeData: any]
  nodesChange: [changes: any[]]
}>()

// 注册自定义节点类型
const nodeTypes: NodeTypesObject = {
  custom: CustomNode as any,
  form: FormNode as any,
  logicStart: LogicStartNode as any,
  logicAction: LogicActionNode as any,
  logicCondition: LogicConditionNode as any
}

const isDragOver = ref(false)
const vueFlowInstance = ref<any>(null)

// 连接节点时添加边
const onConnect = (connection: any) => {
  emit('addEdge', connection)
}

// 节点拖拽结束事件
const onNodeDragStop = (event: any) => {
  if (event.node) {
    emit('updateNode', event.node.id, {
      position: event.node.position
    })
  }
}

// 节点点击事件
const onNodeClick = (event: any) => {
  emit('nodeSelect', event.node)
}

// 边点击事件
const onEdgeClick = (event: any) => {
  emit('edgeSelect', event.edge)
}

// 画布点击事件（取消选择）
const onPaneClick = () => {
  emit('nodeSelect', null)
  emit('edgeSelect', null)
}

// 画布准备就绪事件
const onPaneReady = (instance: any) => {
  console.log('Vue Flow 准备就绪:', instance)
  vueFlowInstance.value = instance
  setTimeout(() => {
    instance.setViewport({ x: 50, y: 20, zoom: 1 })
  }, 100)
}

// 拖拽相关事件处理
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  const transferData = event.dataTransfer?.getData('application/vueflow')
  if (transferData && vueFlowInstance.value) {
    const payload = JSON.parse(transferData)
    const position = vueFlowInstance.value.screenToFlowCoordinate({
      x: event.clientX,
      y: event.clientY
    })
    
    const newNode: any = {
      id: `node_${Date.now()}`,
      type: payload.type,
      position,
      data: {}
    }

    if (payload.type === 'logicAction') {
      newNode.data = {
        label: payload.name || '动作节点',
        actionLabel: payload.name || '动作节点',
        actionType: payload.actionType,
        params: payload.params || {}
      }
    } else if (payload.type === 'logicCondition') {
      newNode.data = {
        label: '条件判断'
      }
    } else {
       // Fallback for existing logic
       newNode.data = {
         label: payload.name || '新节点',
         description: `新建的${payload.name || '节点'}`,
         ...payload.data
       }
       if (payload.style) newNode.style = payload.style
    }
    
    emit('addNode', newNode)
  }
}
</script>

<template>
  <div 
    class="canvas-container"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    :class="{ 'drag-over': isDragOver }"
  >
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      class="vue-flow"
      :min-zoom="0.1"
      :max-zoom="4"
      :snap-to-grid="true"
      :snap-grid="[20, 20]"
      @pane-ready="onPaneReady"
      @node-drag-stop="onNodeDragStop"
      @connect="onConnect"
      @node-click="onNodeClick"
      @edge-click="onEdgeClick"
      @pane-click="onPaneClick"
      @nodes-change="(changes) => emit('nodesChange', changes)"
    >
      <!-- 网格背景 -->
      <Background pattern-color="#e0e0e0" :gap="20" />
      
      <!-- 控制面板 -->
      <Controls />
      
      <!-- 小地图 -->
      <MiniMap 
        :node-color="(node) => {
          if (node.type === 'input') return '#667eea'
          if (node.type === 'output') return '#51cf66'
          if (node.type === 'decision') return '#4facfe'
          if (node.type === 'custom') return '#f093fb'
          if (node.type === 'form') return '#faad14'
          return '#f5f5f5'
        }"
      />
    </VueFlow>
    
    <!-- 拖拽提示 -->
    <div v-if="isDragOver" class="drop-indicator">
      <div class="drop-text">释放以添加节点</div>
    </div>
  </div>
</template>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  transition: all 0.3s ease;
}

.canvas-container.drag-over {
  background: rgba(102, 126, 234, 0.05);
}

.vue-flow {
  flex: 1;
}

.drop-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(102, 126, 234, 0.9);
  color: white;
  padding: 16px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  pointer-events: none;
  z-index: 1000;
}

.drop-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drop-text::before {
  content: '📍';
  font-size: 20px;
}
</style>