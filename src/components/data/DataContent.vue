<template>
  <div class="data-content">
    <div v-if="currentTable" class="table-container">
      <DataEditor
        :table="currentTable"
        :fields="currentTable.fields"
        :records="currentTable.records"
        @update-table="$emit('updateTable', $event)"
        @add-field="handleAddField"
        @update-field="handleUpdateField"
        @delete-field="$emit('deleteField', $event)"
        @add-record="$emit('addRecord', $event)"
        @update-record="handleUpdateRecord"
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

// Make sure emit is properly declared
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

// Add these method handlers
// Then your handler functions can use emit
function handleUpdateField(event: { fieldId: string; updates: any }) {
  emit('updateField', event.fieldId, event.updates)
}

function handleUpdateRecord(event: { index: number; updates: any }) {
  emit('updateRecord', event.index, event.updates)
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