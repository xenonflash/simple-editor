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

// 简化的节点类型配置
const nodeTypes = [
  { 
    icon: '🚀', 
    name: '开始节点', 
    type: 'input',
    style: {
      background: '#667eea',
      border: 'none',
      borderRadius: '12px',
      color: 'white',
      fontSize: '13px',
      fontWeight: '500',
      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
    }
  },
  { 
    icon: '⚙️', 
    name: '处理节点', 
    type: 'default',
    style: {
      background: '#f093fb',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      fontSize: '13px',
      fontWeight: '500',
      boxShadow: '0 2px 8px rgba(240, 147, 251, 0.2)'
    }
  },
  { 
    icon: '❓', 
    name: '判断节点', 
    type: 'decision',
    style: {
      background: '#4facfe',
      border: 'none',
      borderRadius: '50%',
      color: 'white',
      fontSize: '13px',
      fontWeight: '500',
      width: '100px',
      height: '100px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(79, 172, 254, 0.2)'
    }
  },
  { 
    icon: '🏁', 
    name: '结束节点', 
    type: 'output',
    style: {
      background: '#51cf66',
      border: 'none',
      borderRadius: '12px',
      color: 'white',
      fontSize: '13px',
      fontWeight: '500',
      boxShadow: '0 2px 8px rgba(81, 207, 102, 0.2)'
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

// 拖拽开始事件
const handleDragStart = (event: DragEvent, nodeType: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify(nodeType))
    event.dataTransfer.effectAllowed = 'move'
  }
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
        draggable="true"
        @click="handleNodeClick(nodeType)"
        @dragstart="handleDragStart($event, nodeType)"
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
  border-right: 1px solid #f0f0f0;
  background: #fafafa;
}

.panel-title {
  padding: 20px 16px 16px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 1px solid #f0f0f0;
  background: white;
}

.node-list {
  padding: 20px 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.node-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  cursor: grab;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.node-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.node-item:active {
  cursor: grabbing;
  transform: translateY(0);
}

.node-item .icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.node-item .name {
  font-size: 12px;
  color: #555;
  text-align: center;
  font-weight: 500;
}
</style>