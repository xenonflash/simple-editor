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
    <div class="pill">开始</div>
    <div class="node-content">
      <div class="icon">▶</div>
      <div class="label">启动流程</div>
    </div>
    <Handle class="handle handle-out" type="source" :position="Position.Right" />
  </div>
</template>

<style scoped>
.logic-node {
  position: relative;
  padding: 12px 16px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  min-width: 140px;
  transition: all 0.2s ease;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.logic-node.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.18), 0 10px 20px rgba(0, 0, 0, 0.08);
}

.start-node {
  border-left: 4px solid #52c41a;
  background: linear-gradient(135deg, #f6ffed, #eaffd9);
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f6ffed;
  color: #237804;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 6px;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.icon {
  font-size: 14px;
  color: #389e0d;
}

.label {
  font-size: 13px;
  font-weight: 700;
  color: #1f1f1f;
}

.handle {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.handle-out {
  right: 4px;
  top: 50%;
  transform: translate(50%, -50%);
  background: #52c41a;
}
</style>
