<template>
  <div class="data-sidebar">
    <VariableList 
      :variables="variables"
      @edit="$emit('editVariable', $event)"
      @delete="$emit('deleteVariable', $event)"
    />
    
    <TableList 
      :tables="tables"
      :current-table-id="currentTableId"
      @select="$emit('selectTable', $event)"
      @edit="$emit('editTable', $event)"
      @delete="$emit('deleteTable', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { Variable, DataTable } from '../../types/data'
import VariableList from './VariableList.vue'
import TableList from './TableList.vue'

interface Props {
  variables: Variable[]
  tables: DataTable[]
  currentTableId: string | null
}

defineProps<Props>()

defineEmits<{
  selectTable: [id: string]
  editVariable: [id: string]
  deleteVariable: [id: string]
  editTable: [id: string]
  deleteTable: [id: string]
}>()
</script>

<style scoped>
.data-sidebar {
  width: 240px;
  background: #fafafa;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
</style>