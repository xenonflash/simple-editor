<template>
  <div class="data-content">
    <div v-if="!currentTable" class="empty-state">
      <div class="empty-icon">🗃️</div>
      <h3>选择或创建数据表</h3>
      <p>请从左侧选择一个数据表，或创建新的数据表来开始管理数据</p>
    </div>
    
    <div v-else class="table-view">
      <TableEditor 
        :table="currentTable"
        @update-table="$emit('updateTable', $event)"
        @add-field="handleAddField"
        @update-field="$emit('updateField', $event.fieldId, $event.updates)"
        @delete-field="$emit('deleteField', $event)"
      />
      
      <RecordEditor 
        :fields="currentTable.fields"
        :records="currentTable.records"
        @add-record="$emit('addRecord', $event)"
        @update-record="$emit('updateRecord', $event.index, $event.updates)"
        @delete-record="$emit('deleteRecord', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DataTable } from '../../types/data'
import { FieldType } from '../../types/data'
import TableEditor from './TableEditor.vue'
import RecordEditor from './RecordEditor.vue'

interface Props {
  currentTable: DataTable | null
}

defineProps<Props>()

const emit = defineEmits<{
  updateTable: [updates: any]
  addField: [name: string, type: FieldType]
  updateField: [fieldId: string, updates: any]
  deleteField: [fieldId: string]
  addRecord: [record: Record<string, any>]
  updateRecord: [index: number, updates: Record<string, any>]
  deleteRecord: [index: number]
}>()

const handleAddField = (name: string, type: FieldType, options: any) => {
  emit('addField', name, type)
}
</script>

<style scoped>
.data-content {
  flex: 1;
  background: white;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.table-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>