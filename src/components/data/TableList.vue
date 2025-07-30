<template>
  <div class="table-list">
    <div class="section-header">
      <h3>数据表</h3>
      <span class="count">{{ tables.length }}</span>
    </div>
    
    <div class="list-content">
      <div 
        v-for="table in tables" 
        :key="table.id"
        class="table-item"
        :class="{ active: table.id === currentTableId }"
        @click="$emit('select-table', table.id)"
      >
        <div class="table-info">
          <span class="table-name">{{ table.name }}</span>
          <span class="table-meta">
            {{ table.fields.length }} 字段 · {{ table.records.length }} 记录
          </span>
          <span v-if="table.description" class="table-description">
            {{ table.description }}
          </span>
        </div>
        <div class="table-actions">
          <button 
            class="action-btn edit"
            @click.stop="$emit('edit', table.id)"
            title="编辑表信息"
          >
            ✏️
          </button>
          <button 
            class="action-btn delete"
            @click.stop="$emit('delete', table.id)"
            title="删除数据表"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div v-if="tables.length === 0" class="empty-state">
        <p>暂无数据表</p>
        <small>点击工具栏的"添加数据表"按钮创建第一个数据表</small>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DataTable } from '../../types/data'

interface Props {
  tables: DataTable[]
  currentTableId: string | null
}

defineProps<Props>()

defineEmits<{
  'select-table': [id: string]
  edit: [id: string]
  delete: [id: string]
}>()
</script>

<style scoped>
.table-list {
  padding: 8px 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f3f4f6;
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
  background: #10b981;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
}

.table-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-bottom: 4px;
  background: white;
  border: 1px solid #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.table-item:hover {
  border-color: #10b981;
  box-shadow: 0 1px 3px rgba(16, 185, 129, 0.1);
}

.table-item.active {
  background: rgba(16, 185, 129, 0.05);
  border-color: #10b981;
}

.table-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.table-name {
  font-size: 12px;
  font-weight: 500;
  color: #111827;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-meta {
  font-size: 10px;
  color: #6b7280;
  font-weight: 400;
}

.table-description {
  font-size: 10px;
  color: #9ca3af;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.table-item:hover .table-actions {
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
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.action-btn.edit:hover {
  background: #10b981;
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