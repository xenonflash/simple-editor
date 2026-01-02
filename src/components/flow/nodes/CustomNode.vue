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
    <div class="pill">自定义</div>

    <div class="node-header">
      <div class="node-icon" v-if="data.icon">{{ data.icon }}</div>
      <div class="node-title">{{ data.label }}</div>
      <div class="node-status" :style="{ backgroundColor: statusColor }"></div>
    </div>
    
    <div class="node-body" v-if="data.description">
      <p class="node-description">{{ data.description }}</p>
    </div>
    
    <div class="progress-bar" v-if="data.progress !== undefined">
      <div class="progress-fill" :style="{ width: progressWidth, backgroundColor: statusColor }"></div>
    </div>
    
    <Handle class="handle handle-in" type="target" :position="Position.Top" />
    <Handle class="handle handle-out" type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.custom-node {
  position: relative;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  min-width: 200px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  overflow: hidden;
  padding: 12px 16px 16px;
}

.custom-node.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.18), 0 10px 20px rgba(0, 0, 0, 0.08);
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f9f0ff;
  color: #722ed1;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 8px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
}

.node-icon {
  font-size: 18px;
}

.node-title {
  flex: 1;
  font-weight: 700;
  color: #1f1f1f;
  font-size: 13px;
}

.node-status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #fff;
}

.node-body {
  padding: 12px 2px 0;
}

.node-description {
  margin: 0;
  font-size: 12px;
  color: #595959;
  line-height: 1.4;
}

.progress-bar {
  height: 6px;
  background: #f5f5f5;
  position: relative;
  border-radius: 999px;
  margin-top: 10px;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.handle {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.handle-in {
  top: 4px;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #8c8c8c;
}

.handle-out {
  bottom: 4px;
  left: 50%;
  transform: translate(-50%, 50%);
  background: #722ed1;
}
</style>