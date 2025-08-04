<template>
  <div class="table-content">
    <!-- 无选中表的状态 -->
    <div v-if="!currentTable" class="empty-content">
      <n-empty description="请选择一个数据表">
        <template #icon>
          <n-icon size="64"><Layers /></n-icon>
        </template>
      </n-empty>
    </div>
    
    <!-- 表内容 -->
    <div v-else class="content-container">
      <!-- 表头信息 -->
      <div class="table-header">
        <div class="table-title">
          <h2>{{ currentTable.name }}</h2>
          <p v-if="currentTable.description">{{ currentTable.description }}</p>
        </div>
      </div>
      
      <!-- 标签页内容 -->
      <div class="table-tabs">
        <n-tabs v-model:value="activeTab" type="line">
          <n-tab-pane name="fields" tab="字段设计">
            <FieldEdit 
              :table="currentTable"
              @update-table="$emit('update-table', $event)"
              @add-field="$emit('add-field', $event.name, $event.type)"
              @update-field="$emit('update-field', $event.id, $event.updates)"
              @delete-field="$emit('delete-field', $event)" />
          </n-tab-pane>
          
          <n-tab-pane name="records" tab="数据记录">
            <TableRecords 
              :table="currentTable"
              @add-record="$emit('add-record', $event)"
              @update-record="$emit('update-record', $event.index, $event.updates)"
              @delete-record="$emit('delete-record', $event)" />
          </n-tab-pane>
        </n-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Layers } from '@vicons/ionicons5'
import { NIcon } from 'naive-ui'
import type { DataTable, DataField, FieldType } from '../../types/data'
import FieldEdit from './FieldEdit.vue'
import TableRecords from './TableRecords.vue'

defineProps<{
  currentTable: DataTable | null
}>()

defineEmits<{
  'update-table': [updates: Partial<Pick<DataTable, 'name' | 'description'>>]
  'add-field': [name: string, type: FieldType]
  'update-field': [fieldId: string, updates: Partial<DataField>]
  'delete-field': [fieldId: string]
  'add-record': [record: Record<string, any>]
  'update-record': [index: number, updates: Record<string, any>]
  'delete-record': [index: number]
}>()

const activeTab = ref('fields')
</script>

<style scoped>
.table-content {
  flex: 1;
  background: white;
  display: flex;
  flex-direction: column;
}

.empty-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-header {
  padding: 20px 24px;
  border-bottom: 8px solid #f0f0f0;

}

.table-title h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.table-title p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.table-tabs {
  flex: 1;
  padding: 0 24px;
  overflow: hidden;
}

:deep(.n-tabs-content) {
  height: calc(100vh - 200px);
  overflow: hidden;
}

:deep(.n-tab-pane) {
  height: 100%;
  overflow: hidden;
}
</style>