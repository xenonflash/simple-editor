<template>
  <div class="table-list">
    <n-scrollbar>
      <div class="table-items">
        <div 
          v-for="table in tables" 
          :key="table.id"
          class="table-item"
          :class="{ active: table.id === currentTableId }"
          @click="$emit('select-table', table.id)">
          <div class="table-info">
            <div class="table-name">{{ table.name }}</div>
            <div class="table-meta">
              <span class="field-count">
                <n-icon size="12"><ListOutline /></n-icon>
                {{ table.fields.length }} 个字段
              </span>
              <span class="record-count">
                <n-icon size="12"><DocumentOutline /></n-icon>
                {{ table.records.length }} 条记录
              </span>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="tables.length === 0" class="empty-state">
          <n-empty description="暂无数据表">
            <template #icon>
              <n-icon size="48"><GridOutline /></n-icon>
            </template>
          </n-empty>
        </div>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { GridOutline, ListOutline, DocumentOutline } from '@vicons/ionicons5'
import type { DataTable } from '../../types/data'

defineProps<{
  tables: DataTable[]
  currentTableId: string | null
}>()

defineEmits<{
  'select-table': [tableId: string]
}>()
</script>

<style scoped>
.table-list {
  height: 100%;
}

.table-items {
  padding: 8px;
}

.table-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  border: 1px solid #e8e8e8;
}

.table-item:hover {
  background: #f5f5f5;
  border-color: #d9d9d9;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.table-item.active {
  background: #e6f7ff;
  border-color: #1890ff;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);
}

.table-icon {
  margin-right: 12px;
  color: #666;
}

.table-item.active .table-icon {
  color: #1890ff;
}

.table-info {
  flex: 1;
  min-width: 0;
}

.table-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-item.active .table-name {
  color: #1890ff;
}

.table-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.field-count,
.record-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}
</style>