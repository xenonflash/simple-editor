<script setup lang="ts">
import FlowStats from './FlowStats.vue'

interface Props {
  nodes: any[]
  edges: any[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  addNode: [nodeData: any]
}>()

const nodeTypes = [
  { 
    icon: '🚀', 
    name: '开始节点', 
    type: 'input',
    style: {
      background: '#e1f5fe',
      border: '2px solid #01579b',
      borderRadius: '10px'
    }
  },
  { 
    icon: '⚙️', 
    name: '处理节点', 
    type: 'default',
    style: {
      background: '#f3e5f5',
      border: '2px solid #4a148c',
      borderRadius: '8px'
    }
  },
  { 
    icon: '❓', 
    name: '判断节点', 
    type: 'decision',
    style: {
      background: '#fff3e0',
      border: '2px solid #e65100',
      borderRadius: '50%'
    }
  },
  { 
    icon: '🏁', 
    name: '结束节点', 
    type: 'output',
    style: {
      background: '#e8f5e8',
      border: '2px solid #2e7d32',
      borderRadius: '10px'
    }
  }
]

const handleNodeClick = (nodeType: any) => {
  const newNode = {
    type: nodeType.type,
    data: {
      label: nodeType.name,
      description: `新建的${nodeType.name}`
    },
    style: nodeType.style
  }
  emit('addNode', newNode)
}
</script>

<template>
  <div class="left-panel">
    <div class="panel-title">流程节点</div>
    <div class="node-list">
      <div 
        v-for="nodeType in nodeTypes" 
        :key="nodeType.type"
        class="node-item" 
        @click="handleNodeClick(nodeType)"
      >
        <div class="icon">{{ nodeType.icon }}</div>
        <div class="name">{{ nodeType.name }}</div>
      </div>
    </div>
    
    <!-- 流程统计 -->
    <FlowStats :nodes="nodes" :edges="edges" />
  </div>
</template>

<style scoped>
.left-panel {
  width: 240px;
  border-right: 1px solid #e0e0e0;
  background: white;
}

.panel-title {
  padding: 16px;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #e0e0e0;
}

.node-list {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.node-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.node-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
  transform: translateY(-1px);
}

.node-item .icon {
  font-size: 20px;
}

.node-item .name {
  font-size: 11px;
  color: #333;
  text-align: center;
}
</style>