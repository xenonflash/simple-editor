<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'
import { actionRegistry } from '../../../config/actions'

interface Props {
  id: string
  data: {
    actionType: string
    params?: any
  }
  selected?: boolean
}

const props = defineProps<Props>()

const actionLabel = computed(() => {
  const def = actionRegistry.find(a => a.type === props.data.actionType)
  return def?.label || props.data.actionType || '动作'
})

const actionDesc = computed(() => {
  if (!props.data.params) return ''
  const params = props.data.params
  if (props.data.actionType === 'setVar') {
    return `${params.variableName} = ${params.value}`
  }
  if (props.data.actionType === 'pushVar') {
    return `Push to ${params.variableName}`
  }
  return ''
})
</script>

<template>
  <div class="logic-node action-node" :class="{ selected }">
    <Handle type="target" :position="Position.Left" />
    
    <div class="node-header">
      <div class="node-title">{{ actionLabel }}</div>
    </div>
    <div v-if="actionDesc" class="node-desc">{{ actionDesc }}</div>
    
    <Handle type="source" :position="Position.Right" />
  </div>
</template>

<style scoped>
.logic-node {
  padding: 8px 12px;
  border-radius: 4px;
  background: #fff;
  border: 1px solid #e5e5e5;
  min-width: 120px;
  max-width: 200px;
  transition: all 0.2s;
}

.logic-node.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.action-node {
  border-left: 3px solid #1890ff;
}

.node-header {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.node-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.node-desc {
  font-size: 10px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
