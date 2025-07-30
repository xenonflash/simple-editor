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
        @click="$emit('select', table.id)"
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
  select: [id: string]
  edit: [id: string]
  delete: [id: string]
}>()
</script>

<style scoped>
.table-list {
  padding: 16px;
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

.table-item {
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

.table-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
}

.table-item.active {
  background: #e6f7ff;
  border-color: #1890ff;
}

.table-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.table-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.table-meta {
  font-size: 12px;
  color: #666;
}

.table-description {
  font-size: 12px;
  color: #999;
  font-style: italic;
}

.table-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.table-item:hover .table-actions {
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