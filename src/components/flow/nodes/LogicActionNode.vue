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
    <div class="pill">变量操作</div>
    <div class="node-header">
      <div class="node-title">{{ actionLabel }}</div>
      <div v-if="actionDesc" class="node-desc">{{ actionDesc }}</div>
    </div>

    <Handle class="handle handle-in" type="target" :position="Position.Left" />
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
  min-width: 160px;
  max-width: 240px;
  transition: all 0.2s ease;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
}

.logic-node.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.18), 0 10px 20px rgba(0, 0, 0, 0.08);
}

.action-node {
  border-left: 4px solid #1890ff;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f0f5ff;
  color: #1d39c4;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 6px;
}

.node-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-title {
  font-size: 13px;
  font-weight: 700;
  color: #1f1f1f;
}

.node-desc {
  font-size: 11px;
  color: #595959;
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

.handle-out {
  right: 4px;
  top: 50%;
  transform: translate(50%, -50%);
  background: #1890ff;
}
</style>
