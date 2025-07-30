<template>
  <div class="data-content">
    <div v-if="!currentTable" class="empty-state">
      <div class="empty-icon">📊</div>
      <h3>选择数据表</h3>
      <p>请从左侧选择一个数据表开始编辑</p>
    </div>
    
    <div v-else class="content-wrapper">
      <DataEditor 
        :table="currentTable"
        :fields="currentTable.fields"
        :records="currentTable.records"
        @update-table="$emit('updateTable', $event)"
        @add-field="handleAddField"
        @update-field="(fieldId, updates) => $emit('updateField', fieldId, updates)"
        @delete-field="$emit('deleteField', $event)"
        @add-record="$emit('addRecord', $event)"
        @update-record="(index, updates) => $emit('updateRecord', index, updates)"
        @delete-record="$emit('deleteRecord', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DataTable } from '../../types/data'
import { FieldType } from '../../types/data'
import DataEditor from './DataEditor.vue'

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

const handleAddField = (event: { name: string; type: FieldType }) => {
  emit('addField', event.name, event.type)
}
</script>

<style scoped>
.data-content {
  flex: 1;
  background: white;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  padding: 40px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 500;
  color: #666;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: #999;
  text-align: center;
  line-height: 1.5;
}

.content-wrapper {
  flex: 1;
  overflow: hidden;
}
</style>