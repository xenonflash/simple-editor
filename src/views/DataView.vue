<template>
  <div class="data-view">
    <div class="data-container">
      <!-- 左侧面板 -->
      <DataLeftPanel 
        :tables="tables"
        :current-table-id="currentTableId"
        @select-table="selectTable"
        @add-table="showAddTableModal = true" />
      
      <!-- 右侧内容 -->
      <TableContent 
        :current-table="currentTable"
        @update-table="handleUpdateTable"
        @add-field="handleAddField"
        @update-field="handleUpdateField"
        @delete-field="handleDeleteField"
        @add-record="handleAddRecord"
        @update-record="handleUpdateRecord"
        @delete-record="handleDeleteRecord" />
    </div>
    
    <!-- 新增数据表弹窗 -->
    <AddDataTable 
      v-model:show="showAddTableModal"
      @confirm="handleAddTableConfirm" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDataStore } from '../stores/data'
import { FieldType, type DataTable, type DataField } from '../types/data'
import DataLeftPanel from '../components/data/DataLeftPanel.vue'
import TableContent from '../components/data/TableContent.vue'
import AddDataTable from '../components/data/AddDataTable.vue'

const dataStore = useDataStore()
const { tables, currentTableId, currentTable } = storeToRefs(dataStore)
const showAddTableModal = ref(false)

// 添加调试监听
watch(tables, (newTables: DataTable[]) => {
  console.log('Tables changed:', newTables)
}, { deep: true })

// 处理新增数据表确认
const handleAddTableConfirm = (data: { name: string; description: string }) => {
  console.log('handleAddTableConfirm called with:', data)
  const table = dataStore.addTable(data.name, data.description)
  console.log('Table created:', table)
  console.log('Current tables:', dataStore.tables)
  dataStore.selectTable(table.id)
}

// 初始化演示数据
onMounted(() => {
  dataStore.initDemoData()
})

// 事件处理
const selectTable = (tableId: string) => {
  dataStore.selectTable(tableId)
}

const handleUpdateTable = (updates: Partial<Pick<DataTable, 'name' | 'description'>>) => {
  if (currentTableId.value) {
    dataStore.updateTable(currentTableId.value, updates)
  }
}

const handleAddField = (name: string, type: FieldType) => {
  if (currentTableId.value) {
    dataStore.addField(currentTableId.value, name, type)
  }
}

const handleUpdateField = (fieldId: string, updates: Partial<DataField>) => {
  if (currentTableId.value) {
    dataStore.updateField(currentTableId.value, fieldId, updates)
  }
}

const handleDeleteField = (fieldId: string) => {
  if (currentTableId.value) {
    dataStore.deleteField(currentTableId.value, fieldId)
  }
}

const handleAddRecord = (record: Record<string, any>) => {
  if (currentTableId.value) {
    dataStore.addRecord(currentTableId.value, record)
  }
}

const handleUpdateRecord = (index: number, updates: Record<string, any>) => {
  if (currentTableId.value) {
    dataStore.updateRecord(currentTableId.value, index, updates)
  }
}

const handleDeleteRecord = (index: number) => {
  if (currentTableId.value) {
    dataStore.deleteRecord(currentTableId.value, index)
  }
}
</script>

<style scoped>
.data-view {
  height: 100vh;
  background: #f5f5f5;
}

.data-container {
  height: 100%;
  display: flex;
  gap: 1px;
  background: #e0e0e0;
}
</style>
