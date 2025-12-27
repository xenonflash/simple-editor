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
  <div class="logic-node condition-node" :class="{ selected }">
    <Handle type="target" :position="Position.Left" />
    
    <div class="node-content">
      <div class="icon">◇</div>
      <div class="label">{{ data.label || '条件判断' }}</div>
    </div>
    <div class="expression" v-if="data.expression">{{ data.expression }}</div>
    
    <!-- True Output -->
    <div class="handle-label true-label">是</div>
    <Handle id="true" type="source" :position="Position.Top" style="top: 0; right: 50%; transform: translate(50%, -50%)" />
    
    <!-- False Output -->
    <div class="handle-label false-label">否</div>
    <Handle id="false" type="source" :position="Position.Bottom" style="bottom: 0; right: 50%; transform: translate(50%, 50%)" />
  </div>
</template>

<style scoped>
.logic-node {
  padding: 12px;
  border-radius: 4px;
  background: #fff;
  border: 1px solid #e5e5e5;
  min-width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transform: rotate(45deg); /* 菱形外观 */
  width: 80px;
  height: 80px;
}

.logic-node.selected {
  border-color: #faad14;
  box-shadow: 0 0 0 2px rgba(250, 173, 20, 0.2);
}

.condition-node {
  background: #fffbe6;
  border-color: #ffe58f;
}

.node-content {
  transform: rotate(-45deg); /* 内容转回来 */
  text-align: center;
}

.expression {
  transform: rotate(-45deg);
  font-size: 10px;
  color: #666;
  margin-top: 4px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.handle-label {
  position: absolute;
  font-size: 10px;
  color: #999;
  transform: rotate(-45deg);
  pointer-events: none;
}

.true-label {
  top: -15px;
  right: -15px;
}

.false-label {
  bottom: -15px;
  left: -15px;
}
</style>
