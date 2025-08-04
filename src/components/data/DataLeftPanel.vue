<template>
  <div class="data-left-panel">
    <!-- 头部标题 -->
    <div class="panel-header">
      <h3>数据表</h3>
      <n-button 
        type="primary" 
        size="small" 
        @click="$emit('add-table')">
        <template #icon>
          <n-icon><Add /></n-icon>
        </template>
        添加
      </n-button>
    </div>
    
    <!-- 表格列表 -->
    <div class="panel-content">
      <TableList 
        :tables="tables"
        :current-table-id="currentTableId"
        @select-table="$emit('select-table', $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Add } from '@vicons/ionicons5'
import type { DataTable } from '../../types/data'
import TableList from './TableList.vue'

defineProps<{
  tables: DataTable[]
  currentTableId: string | null
}>()

defineEmits<{
  'select-table': [tableId: string]
  'add-table': []
}>()
</script>

<style scoped>
.data-left-panel {
  width: 240px;
  background: white;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.panel-content {
  flex: 1;
  overflow: hidden;
}
</style>