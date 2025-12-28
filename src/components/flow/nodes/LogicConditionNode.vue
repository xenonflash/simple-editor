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
    <!-- Diamond Shape Background -->
    <div class="node-shape"></div>
    
    <!-- Content -->
    <div class="node-content">
      <div class="icon">◇</div>
      <div class="label">{{ data.label || '条件判断' }}</div>
      <div class="expression" v-if="data.expression">{{ data.expression }}</div>
    </div>
    
    <!-- Input Handle -->
    <Handle 
      type="target" 
      :position="Position.Left" 
      style="left: 0; top: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background: #555; border-radius: 50%;" 
    />
    
    <!-- True Output -->
    <div class="handle-label true-label">是</div>
    <Handle 
      id="true" 
      type="source" 
      :position="Position.Right" 
      style="right: 0; top: 50%; transform: translate(50%, -50%); width: 8px; height: 8px; background: #52c41a; border-radius: 50%;" 
    />
    
    <!-- False Output -->
    <div class="handle-label false-label">否</div>
    <Handle 
      id="false" 
      type="source" 
      :position="Position.Bottom" 
      style="bottom: 0; left: 50%; transform: translate(-50%, 50%); width: 8px; height: 8px; background: #ff4d4f; border-radius: 50%;" 
    />
  </div>
</template>

<style scoped>
.logic-node-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-shape {
  position: absolute;
  width: 70px;
  height: 70px;
  background: #fffbe6;
  border: 1px solid #ffe58f;
  transform: rotate(45deg);
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.logic-node-wrapper.selected .node-shape {
  border-color: #faad14;
  box-shadow: 0 0 0 2px rgba(250, 173, 20, 0.2);
}

.node-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  font-size: 12px;
  color: #595959;
  max-width: 80px;
  text-align: center;
}

.icon {
  font-size: 16px;
  margin-bottom: 2px;
  color: #faad14;
}

.label {
  font-weight: 500;
  line-height: 1.2;
}

.expression {
  font-size: 10px;
  color: #8c8c8c;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90px;
}

.handle-label {
  position: absolute;
  font-size: 10px;
  color: #8c8c8c;
  pointer-events: none;
}

.true-label {
  right: 8px;
  top: 25px;
  color: #52c41a;
}

.false-label {
  bottom: 8px;
  left: 60px;
  color: #ff4d4f;
}
</style>
