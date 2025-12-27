<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

interface Props {
  id: string
  data: {
    label?: string
  }
  selected?: boolean
}

defineProps<Props>()
</script>

<template>
  <div class="logic-node start-node" :class="{ selected }">
    <div class="node-content">
      <div class="icon">▶</div>
      <div class="label">开始</div>
    </div>
    <Handle type="source" :position="Position.Right" />
  </div>
</template>

<style scoped>
.logic-node {
  padding: 8px 16px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid #e5e5e5;
  min-width: 100px;
  transition: all 0.2s;
}

.logic-node.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.start-node {
  background: #f0f9eb;
  border-color: #b7eb8f;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.icon {
  font-size: 12px;
  color: #52c41a;
}

.label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}
</style>
