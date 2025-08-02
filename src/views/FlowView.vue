<script setup lang="ts">
import { ref } from 'vue'
import FlowNodePanel from '@/components/flow/FlowNodePanel.vue'
import FlowCanvas from '@/components/flow/FlowCanvas.vue'
import FlowPropertiesPanel from '@/components/flow/FlowPropertiesPanel.vue'

// 全局状态管理 - 包含自定义节点的演示数据
const nodes = ref([
  // 开始节点
  {
    id: 'start',
    type: 'input',
    position: { x: 100, y: 50 },
    data: { 
      label: '开始：用户注册流程',
      description: '用户访问注册页面'
    },
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
  
  // 表单节点 - 用户信息收集
  {
    id: 'userForm',
    type: 'form',
    position: { x: 100, y: 180 },
    data: {
      label: '用户信息表单',
      fields: [
        {
          name: '用户名',
          type: 'text',
          value: ''
        },
        {
          name: '邮箱',
          type: 'text',
          value: ''
        },
        {
          name: '用户类型',
          type: 'select',
          value: '普通用户',
          options: ['普通用户', 'VIP用户', '企业用户']
        },
        {
          name: '年龄',
          type: 'number',
          value: 18
        }
      ]
    }
  },
  
  // 自定义节点 - 数据验证
  {
    id: 'validation',
    type: 'custom',
    position: { x: 400, y: 180 },
    data: {
      label: '数据验证',
      description: '验证用户输入的信息格式和完整性',
      icon: '🔍',
      status: 'info',
      progress: 0
    }
  },
  
  // 判断节点
  {
    id: 'decision',
    type: 'decision',
    position: { x: 400, y: 350 },
    data: {
      label: '验证通过？',
      description: '检查数据是否符合要求'
    },
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
  
  // 自定义节点 - 数据库操作
  {
    id: 'database',
    type: 'custom',
    position: { x: 600, y: 280 },
    data: {
      label: '保存到数据库',
      description: '将用户信息存储到数据库中',
      icon: '💾',
      status: 'success',
      progress: 100
    }
  },
  
  // 表单节点 - 邮件配置
  {
    id: 'emailConfig',
    type: 'form',
    position: { x: 600, y: 450 },
    data: {
      label: '邮件发送配置',
      fields: [
        {
          name: '邮件模板',
          type: 'select',
          value: '欢迎邮件',
          options: ['欢迎邮件', '验证邮件', '通知邮件']
        },
        {
          name: '发送延迟(秒)',
          type: 'number',
          value: 0
        },
        {
          name: '邮件内容',
          type: 'textarea',
          value: '欢迎加入我们的平台！'
        }
      ]
    }
  },
  
  // 自定义节点 - 发送邮件
  {
    id: 'sendEmail',
    type: 'custom',
    position: { x: 800, y: 350 },
    data: {
      label: '发送欢迎邮件',
      description: '向用户发送注册成功的欢迎邮件',
      icon: '📧',
      status: 'warning',
      progress: 75
    }
  },
  
  // 错误处理节点
  {
    id: 'error',
    type: 'custom',
    position: { x: 200, y: 450 },
    data: {
      label: '错误处理',
      description: '处理验证失败的情况',
      icon: '❌',
      status: 'error',
      progress: 0
    }
  },
  
  // 结束节点
  {
    id: 'end',
    type: 'output',
    position: { x: 800, y: 550 },
    data: {
      label: '注册完成',
      description: '用户注册流程成功完成'
    },
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
  // 主流程
  {
    id: 'e1',
    source: 'start',
    target: 'userForm',
    animated: true,
    style: { stroke: '#667eea', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#667eea' }
  },
  {
    id: 'e2',
    source: 'userForm',
    target: 'validation',
    style: { stroke: '#faad14', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#faad14' }
  },
  {
    id: 'e3',
    source: 'validation',
    target: 'decision',
    style: { stroke: '#f093fb', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#f093fb' }
  },
  
  // 验证成功分支
  {
    id: 'e4',
    source: 'decision',
    target: 'database',
    label: '验证通过',
    style: { stroke: '#51cf66', strokeWidth: 2 },
    labelStyle: { fill: '#51cf66', fontWeight: '500', fontSize: '12px' },
    markerEnd: { type: 'arrowclosed', color: '#51cf66' }
  },
  {
    id: 'e5',
    source: 'database',
    target: 'emailConfig',
    style: { stroke: '#f093fb', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#f093fb' }
  },
  {
    id: 'e6',
    source: 'emailConfig',
    target: 'sendEmail',
    style: { stroke: '#faad14', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#faad14' }
  },
  {
    id: 'e7',
    source: 'sendEmail',
    target: 'end',
    style: { stroke: '#51cf66', strokeWidth: 2 },
    markerEnd: { type: 'arrowclosed', color: '#51cf66' }
  },
  
  // 验证失败分支
  {
    id: 'e8',
    source: 'decision',
    target: 'error',
    label: '验证失败',
    type: 'smoothstep',
    style: { stroke: '#ff6b6b', strokeWidth: 2, strokeDasharray: '6,3' },
    labelStyle: { fill: '#ff6b6b', fontWeight: '500', fontSize: '12px' },
    markerEnd: { type: 'arrowclosed', color: '#ff6b6b' }
  },
  {
    id: 'e9',
    source: 'error',
    target: 'userForm',
    label: '重新填写',
    type: 'smoothstep',
    style: { stroke: '#ff6b6b', strokeWidth: 2, strokeDasharray: '3,3' },
    labelStyle: { fill: '#ff6b6b', fontWeight: '500', fontSize: '12px' },
    markerEnd: { type: 'arrowclosed', color: '#ff6b6b' }
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
  background: #e3e3e3;
  border-radius: 0 8px 8px 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
</style>