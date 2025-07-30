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
  padding: 20px 16px 16px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.count {
  background: #667eea;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.list-content {
  padding: 16px;
}

.variable-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.variable-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  transform: translateY(-1px);
}

.variable-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.variable-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.variable-type {
  font-size: 12px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
}

.variable-value {
  font-size: 12px;
  color: #666;
}

.variable-actions {
  display: flex;
  gap: 4px;
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
  background: #f8f9fa;
  color: #667eea;
}

.action-btn.edit:hover {
  background: #667eea;
  color: white;
}

.action-btn.delete {
  background: #f8f9fa;
  color: #dc3545;
}

.action-btn.delete:hover {
  background: #dc3545;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-state p {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.empty-state small {
  font-size: 12px;
  color: #ccc;
}
</style>