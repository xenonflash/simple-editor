<script setup lang="ts">
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
}>()

const { 
  onPaneReady, 
  onNodeDragStop, 
  onConnect, 
  setViewport, 
  onNodeClick, 
  onEdgeClick,
  onPaneClick
} = useVueFlow()

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
</script>

<template>
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
    <Background pattern-color="#aaa" :gap="20" />
    
    <!-- 控制面板 -->
    <Controls />
    
    <!-- 小地图 -->
    <MiniMap 
      :node-color="(node) => {
        if (node.type === 'input') return '#e1f5fe'
        if (node.type === 'output') return '#e8f5e8'
        if (node.type === 'decision') return '#fff3e0'
        return '#f5f5f5'
      }"
    />
  </VueFlow>
</template>

<style scoped>
.vue-flow {
  flex: 1;
}
</style>