<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  nodes: any[]
  edges: any[]
}

const props = defineProps<Props>()

const branchCount = computed(() => {
  return props.nodes.filter(node => 
    node.data?.label?.includes('？') || 
    node.type === 'decision'
  ).length
})

const inputNodes = computed(() => {
  return props.nodes.filter(node => node.type === 'input').length
})

const outputNodes = computed(() => {
  return props.nodes.filter(node => node.type === 'output').length
})
</script>

<template>
  <div class="panel-section">
    <div class="section-title">流程统计</div>
    <div class="stats">
      <div class="stat-item">
        <span class="label">节点数量:</span>
        <span class="value">{{ nodes.length }}</span>
      </div>
      <div class="stat-item">
        <span class="label">连接数量:</span>
        <span class="value">{{ edges.length }}</span>
      </div>
      <div class="stat-item">
        <span class="label">分支数量:</span>
        <span class="value">{{ branchCount }}</span>
      </div>
      <div class="stat-item">
        <span class="label">开始节点:</span>
        <span class="value">{{ inputNodes }}</span>
      </div>
      <div class="stat-item">
        <span class="label">结束节点:</span>
        <span class="value">{{ outputNodes }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-section {
  margin-top: 20px;
  padding: 0 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.stat-item .label {
  font-size: 12px;
  color: #666;
}

.stat-item .value {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}
</style>