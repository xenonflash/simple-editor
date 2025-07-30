<script setup lang="ts">
import { ref } from 'vue'
import FlowToolbar from '@/components/flow/FlowToolbar.vue'
import FlowNodePanel from '@/components/flow/FlowNodePanel.vue'
import FlowCanvas from '@/components/flow/FlowCanvas.vue'
import FlowPropertiesPanel from '@/components/flow/FlowPropertiesPanel.vue'

// 全局状态管理
const nodes = ref([
  // 开始节点 - 简化样式
  {
    id: 'start',
    type: 'input',
    data: { 
      label: '用户注册流程开始',
      description: '触发器：用户提交注册表单'
    },
    position: { x: 100, y: 50 },
    style: {
      background: '#667eea',
      border: 'none',
      borderRadius: '12px',
      color: 'white',
      fontSize: '13px',
      fontWeight: '500',
      padding: '12px 16px',
      boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
    }
  },
  // 数据验证节点
  {
    id: 'validate',
    data: { 
      label: '数据验证',
      description: '验证邮箱格式、密码强度等'
    },
    position: { x: 100, y: 150 },
    style: {
      background: '#f093fb',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      fontSize: '13px',
      fontWeight: '500',
      padding: '12px 16px',
      boxShadow: '0 2px 8px rgba(240, 147, 251, 0.2)'
    }
  },
  // 判断节点
  {
    id: 'decision1',
    data: { 
      label: '验证是否通过？',
      description: '条件判断节点'
    },
    position: { x: 100, y: 250 },
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
  // 错误处理节点
  {
    id: 'error',
    data: { 
      label: '返回错误信息',
      description: '显示具体的验证错误'
    },
    position: { x: 300, y: 250 },
    style: {
      background: '#ff6b6b',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
      fontSize: '13px',
      fontWeight: '500',
      padding: '12px 16px',
      boxShadow: '0 2px 8px rgba(255, 107, 107, 0.2)'
    }
  },
  // 结束节点
  {
    id: 'end',
    type: 'output',
    data: { 
      label: '注册流程完成',
      description: '用户成功注册并激活'
    },
    position: { x: 200, y: 400 },
    style: {
      background: '#51cf66',
      border: 'none',
      borderRadius: '12px',
      color: 'white',
      fontSize: '13px',
      fontWeight: '500',
      padding: '12px 16px',
      boxShadow: '0 2px 8px rgba(81, 207, 102, 0.2)'
    }
  }
])

const edges = ref([
  { 
    id: 'e1', 
    source: 'start', 
    target: 'validate',
    animated: true,
    style: { 
      stroke: '#667eea', 
      strokeWidth: 2
    },
    markerEnd: {
      type: 'arrowclosed',
      color: '#667eea'
    }
  },
  { 
    id: 'e2', 
    source: 'validate', 
    target: 'decision1',
    style: { 
      stroke: '#f093fb', 
      strokeWidth: 2
    },
    markerEnd: {
      type: 'arrowclosed',
      color: '#f093fb'
    }
  },
  // 验证失败分支
  { 
    id: 'e3', 
    source: 'decision1', 
    target: 'error',
    label: '验证失败',
    type: 'smoothstep',
    style: { 
      stroke: '#ff6b6b', 
      strokeWidth: 2,
      strokeDasharray: '6,3'
    },
    labelStyle: { 
      fill: '#ff6b6b', 
      fontWeight: '500',
      fontSize: '12px'
    },
    markerEnd: {
      type: 'arrowclosed',
      color: '#ff6b6b'
    }
  },
  // 验证成功分支
  { 
    id: 'e4', 
    source: 'decision1', 
    target: 'end',
    label: '验证通过',
    style: { 
      stroke: '#51cf66', 
      strokeWidth: 2
    },
    labelStyle: { 
      fill: '#51cf66', 
      fontWeight: '500',
      fontSize: '12px'
    },
    markerEnd: {
      type: 'arrowclosed',
      color: '#51cf66'
    }
  }
])

const selectedNode = ref<any>(null)
const selectedEdge = ref<any>(null)

// 提供给子组件的方法
const updateNode = (nodeId: string, updates: any) => {
  const nodeIndex = nodes.value.findIndex(n => n.id === nodeId)
  if (nodeIndex !== -1) {
    nodes.value[nodeIndex] = { ...nodes.value[nodeIndex], ...updates }
  }
}

const addNode = (nodeData: any) => {
  const newNode = {
    ...nodeData,
    id: `node_${Date.now()}`,
    position: nodeData.position || { x: 200, y: 200 }
  }
  nodes.value.push(newNode)
}

const deleteNode = (nodeId: string) => {
  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  edges.value = edges.value.filter(e => e.source !== nodeId && e.target !== nodeId)
}

const addEdge = (edgeData: any) => {
  const newEdge = {
    ...edgeData,
    id: `edge_${Date.now()}`,
    style: {
      stroke: '#667eea',
      strokeWidth: 2
    },
    markerEnd: {
      type: 'arrowclosed',
      color: '#667eea'
    }
  }
  edges.value.push(newEdge)
}

// 工具栏事件处理
const handleToolbarAction = (action: string) => {
  switch (action) {
    case 'save':
      console.log('保存流程图', { nodes: nodes.value, edges: edges.value })
      break
    case 'export':
      console.log('导出流程图')
      break
    case 'import':
      console.log('导入流程图')
      break
    case 'clear':
      nodes.value = []
      edges.value = []
      selectedNode.value = null
      selectedEdge.value = null
      break
    case 'undo':
      console.log('撤销')
      break
    case 'redo':
      console.log('重做')
      break
    case 'autoLayout':
      console.log('自动布局')
      break
    case 'fitView':
      console.log('适应画布')
      break
  }
}

// 节点选择事件
const handleNodeSelect = (node: any) => {
  selectedNode.value = node
  selectedEdge.value = null
}

// 边选择事件
const handleEdgeSelect = (edge: any) => {
  selectedEdge.value = edge
  selectedNode.value = null
}

// 属性更新事件
const handlePropertyUpdate = (updates: any) => {
  if (selectedNode.value) {
    updateNode(selectedNode.value.id, updates)
    // 更新选中节点的引用
    selectedNode.value = { ...selectedNode.value, ...updates }
  }
}
</script>

<template>
  <div class="flow-container">
    <!-- 左侧节点面板 -->
    <FlowNodePanel 
      :nodes="nodes"
      :edges="edges"
      @add-node="addNode"
    />

    <!-- 主体区域 -->
    <div class="flow-main">
      <!-- 顶部工具栏 -->
      <FlowToolbar @action="handleToolbarAction" />
      
      <!-- 画布区域 -->
      <FlowCanvas
        :nodes="nodes"
        :edges="edges"
        @node-select="handleNodeSelect"
        @edge-select="handleEdgeSelect"
        @add-edge="addEdge"
        @update-node="updateNode"
        @add-node="addNode"
      />
    </div>

    <!-- 右侧属性面板 -->
    <FlowPropertiesPanel
      :selected-node="selectedNode"
      :selected-edge="selectedEdge"
      @update="handlePropertyUpdate"
    />
  </div>
</template>

<style scoped>
.flow-container {
  height: calc(100vh - 48px);
  display: flex;
  overflow: hidden;
  background: #f8f9fa;
}

.flow-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 0 8px 8px 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
</style>