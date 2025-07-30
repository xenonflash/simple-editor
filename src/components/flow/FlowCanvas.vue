<script setup lang="ts">
import { ref } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { Background } from '@vue-flow/background'
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
}>()

const { 
  onPaneReady, 
  onNodeDragStop, 
  onConnect, 
  setViewport, 
  onNodeClick, 
  onEdgeClick,
  onPaneClick,
  screenToFlowCoordinate
} = useVueFlow()

const isDragOver = ref(false)

// 连接节点时添加边
onConnect((connection) => {
  emit('addEdge', connection)
})

// 节点拖拽结束事件
onNodeDragStop((event) => {
  if (event.node) {
    emit('updateNode', event.node.id, {
      position: event.node.position
    })
  }
})

// 节点点击事件
onNodeClick((event) => {
  emit('nodeSelect', event.node)
})

// 边点击事件
onEdgeClick((event) => {
  emit('edgeSelect', event.edge)
})

// 画布点击事件（取消选择）
onPaneClick(() => {
  emit('nodeSelect', null)
  emit('edgeSelect', null)
})

// 画布准备就绪事件
onPaneReady((instance) => {
  console.log('Vue Flow 准备就绪:', instance)
  setTimeout(() => {
    setViewport({ x: 50, y: 20, zoom: 1 })
  }, 100)
})

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
  
  const nodeData = event.dataTransfer?.getData('application/vueflow')
  if (nodeData) {
    const nodeType = JSON.parse(nodeData)
    const position = screenToFlowCoordinate({
      x: event.clientX,
      y: event.clientY
    })
    
    const newNode = {
      type: nodeType.type,
      data: {
        label: nodeType.name,
        description: `新建的${nodeType.name}`
      },
      style: nodeType.style,
      position
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
      class="vue-flow"
      :min-zoom="0.1"
      :max-zoom="4"
      :snap-to-grid="true"
      :snap-grid="[20, 20]"
    >
      <!-- 网格背景 -->
      <Background pattern-color="#e0e0e0" :gap="20" />
      
      <!-- 控制面板 -->
      <Controls />
      
      <!-- 小地图 -->
      <MiniMap 
        :node-color="(node) => {
          if (node.type === 'input') return '#667eea'
          if (node.type === 'output') return '#a8edea'
          if (node.type === 'decision') return '#4facfe'
          return '#f093fb'
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
  flex: 1;
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