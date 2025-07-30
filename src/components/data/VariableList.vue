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
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.count {
  background: #f0f0f0;
  color: #666;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.variable-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.variable-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
}

.variable-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.variable-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.variable-type {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  width: fit-content;
}

.variable-value {
  font-size: 12px;
  color: #999;
  font-family: monospace;
}

.variable-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.variable-item:hover .variable-actions {
  opacity: 1;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.action-btn.edit {
  background: #f0f0f0;
  color: #666;
}

.action-btn.edit:hover {
  background: #1890ff;
  color: white;
}

.action-btn.delete {
  background: #fff2f0;
  color: #ff4d4f;
}

.action-btn.delete:hover {
  background: #ff4d4f;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 24px 12px;
  color: #999;
}

.empty-state p {
  margin: 0 0 4px 0;
  font-size: 14px;
}

.empty-state small {
  font-size: 12px;
  color: #ccc;
}
</style>