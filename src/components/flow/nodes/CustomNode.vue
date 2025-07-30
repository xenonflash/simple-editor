<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'

// 定义 props
interface Props {
  id: string
  data: {
    label: string
    description?: string
    icon?: string
    status?: 'success' | 'error' | 'warning' | 'info'
    progress?: number
  }
  selected?: boolean
}

const props = defineProps<Props>()

// 计算属性
const statusColor = computed(() => {
  switch (props.data.status) {
    case 'success': return '#52c41a'
    case 'error': return '#ff4d4f'
    case 'warning': return '#faad14'
    case 'info': return '#1890ff'
    default: return '#d9d9d9'
  }
})

const progressWidth = computed(() => {
  return `${props.data.progress || 0}%`
})

// 事件处理
const handleClick = () => {
  console.log('Custom node clicked:', props.id)
}
</script>

<template>
  <div class="custom-node" :class="{ selected }" @click="handleClick">
    <!-- 输入连接点 -->
    <Handle type="target" :position="Position.Top" />
    
    <!-- 节点内容 -->
    <div class="node-header">
      <div class="node-icon" v-if="data.icon">{{ data.icon }}</div>
      <div class="node-title">{{ data.label }}</div>
      <div class="node-status" :style="{ backgroundColor: statusColor }"></div>
    </div>
    
    <div class="node-body" v-if="data.description">
      <p class="node-description">{{ data.description }}</p>
    </div>
    
    <!-- 进度条 -->
    <div class="progress-bar" v-if="data.progress !== undefined">
      <div class="progress-fill" 
           :style="{ width: progressWidth, backgroundColor: statusColor }"></div>
    </div>
    
    <!-- 输出连接点 -->
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.custom-node {
  background: white;
  border: 2px solid #e1e1e1;
  border-radius: 12px;
  min-width: 180px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  overflow: hidden;
}

.custom-node.selected {
  border-color: #1890ff;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.3);
}

.node-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.node-icon {
  font-size: 20px;
  margin-right: 8px;
}

.node-title {
  flex: 1;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.node-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.node-body {
  padding: 12px 16px;
}

.node-description {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.progress-bar {
  height: 4px;
  background: #f0f0f0;
  position: relative;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}
</style>