<template>
  <div class="variable-list">
    <div class="section-header">
      <h3>运行时变量</h3>
      <span class="count">{{ variables.length }}</span>
    </div>
    
    <div class="list-content">
      <div 
        v-for="variable in variables" 
        :key="variable.id"
        class="variable-item"
        @click="$emit('edit', variable.id)"
      >
        <div class="variable-info">
          <span class="variable-name">{{ variable.name }}</span>
          <span class="variable-type">{{ variable.type }}</span>
          <span class="variable-value">{{ formatValue(variable.value) }}</span>
        </div>
        <div class="variable-actions">
          <button 
            class="action-btn edit"
            @click.stop="$emit('edit', variable.id)"
            title="编辑变量"
          >
            ✏️
          </button>
          <button 
            class="action-btn delete"
            @click.stop="$emit('delete', variable.id)"
            title="删除变量"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div v-if="variables.length === 0" class="empty-state">
        <p>暂无变量</p>
        <small>点击工具栏的"添加变量"按钮创建第一个变量</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Variable } from '../../types/data'

interface Props {
  variables: Variable[]
}

defineProps<Props>()

defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.length > 20 ? value.substring(0, 20) + '...' : value
  if (typeof value === 'object') return JSON.stringify(value).substring(0, 20) + '...'
  return String(value)
}
</script>

<style scoped>
.variable-list {
  border-bottom: 1px solid #f0f0f0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 8px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.count {
  background: #6366f1;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
}

.list-content {
  padding: 8px 12px;
}

.variable-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  margin-bottom: 4px;
  background: white;
  border: 1px solid #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.variable-item:hover {
  border-color: #6366f1;
  box-shadow: 0 1px 3px rgba(99, 102, 241, 0.1);
}

.variable-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.variable-name {
  font-weight: 500;
  color: #111827;
  font-size: 12px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.variable-type {
  font-size: 10px;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
  width: fit-content;
  font-weight: 500;
  text-transform: uppercase;
}

.variable-value {
  font-size: 10px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'SF Mono', monospace;
}

.variable-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.variable-item:hover .variable-actions {
  opacity: 1;
}

.action-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  transition: all 0.15s ease;
}

.action-btn.edit {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.action-btn.edit:hover {
  background: #6366f1;
  color: white;
}

.action-btn.delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.action-btn.delete:hover {
  background: #ef4444;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 24px 16px;
  color: #9ca3af;
}

.empty-state p {
  margin: 0 0 4px 0;
  font-size: 12px;
  font-weight: 500;
}

.empty-state small {
  font-size: 10px;
  color: #d1d5db;
}
</style>