<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

interface Props {
  id: string
  data: {
    label?: string
    expression?: string
  }
  selected?: boolean
}

defineProps<Props>()
</script>

<template>
  <div class="logic-node-wrapper" :class="{ selected }">
    <div class="node-shape"></div>

    <div class="node-content">
      <div class="pill">条件</div>
      <div class="label">{{ data.label || '条件判断' }}</div>
      <div class="expression" v-if="data.expression">{{ data.expression }}</div>
    </div>

    <Handle
      class="handle handle-in"
      type="target"
      :position="Position.Left"
    />

    <div class="handle-label true-label">是</div>
    <Handle
      id="true"
      class="handle handle-true"
      type="source"
      :position="Position.Right"
    />

    <div class="handle-label false-label">否</div>
    <Handle
      id="false"
      class="handle handle-false"
      type="source"
      :position="Position.Bottom"
    />
  </div>
</template>

<style scoped>
.logic-node-wrapper {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-shape {
  position: absolute;
  width: 110px;
  height: 110px;
  background: linear-gradient(135deg, #fff7e6, #ffe6ba);
  border: 1px solid #ffd591;
  transform: rotate(45deg);
  transition: all 0.2s ease;
  box-shadow: 0 6px 16px rgba(250, 173, 20, 0.18);
  border-radius: 16px;
}

.logic-node-wrapper.selected .node-shape {
  border-color: #fa8c16;
  box-shadow: 0 0 0 2px rgba(250, 140, 22, 0.22), 0 8px 20px rgba(250, 173, 20, 0.25);
}

.node-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  pointer-events: none;
  text-align: center;
}

.pill {
  padding: 2px 8px;
  background: #fff;
  color: #d48806;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.label {
  font-weight: 700;
  line-height: 1.2;
  font-size: 13px;
  color: #ad6800;
  max-width: 120px;
}

.expression {
  font-size: 11px;
  color: #8c8c8c;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  left: 4px;
  top: 50%;
  transform: translate(-50%, -50%);
  background: #8c8c8c;
}

.handle-true {
  right: 4px;
  top: 45%;
  transform: translate(50%, -50%);
  background: #52c41a;
}

.handle-false {
  bottom: 6px;
  left: 50%;
  transform: translate(-50%, 50%);
  background: #ff4d4f;
}

.handle-label {
  position: absolute;
  font-size: 11px;
  color: #8c8c8c;
  pointer-events: none;
  font-weight: 600;
}

.true-label {
  right: 12px;
  top: 38px;
  color: #389e0d;
}

.false-label {
  bottom: 20px;
  left: 64px;
  color: #d4380d;
}
</style>
