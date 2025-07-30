<template>
  <div class="data-view">
    <DataToolbar 
      @add-variable="handleAddVariable"
      @add-table="handleAddTable"
      @import="handleImport"
      @export="handleExport"
    />
    
    <div class="data-main">
      <DataSidebar 
        :variables="variables"
        :tables="tables"
        :current-table-id="currentTableId"
        @select-table="selectTable"
        @edit-variable="handleEditVariable"
        @delete-variable="deleteVariable"
        @edit-table="handleEditTable"
        @delete-table="deleteTable"
      />
      
      <DataContent 
        :current-table="currentTable"
        @update-table="handleUpdateTable"
        @add-field="handleAddField"
        @update-field="handleUpdateField"
        @delete-field="handleDeleteField"
        @add-record="handleAddRecord"
        @update-record="handleUpdateRecord"
        @delete-record="handleDeleteRecord"
      />
    </div>
  </div>
</template>

<style scoped>
.data-view {
  height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f8f9fa;
}

.data-main {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: #ffffff;
  border-radius: 0 8px 8px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
</style>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDataStore } from '../stores/data'
import { FieldType, type DataTable, type DataField } from '../types/data'  // Use type-only imports
import DataToolbar from '../components/data/DataToolbar.vue'
import DataSidebar from '../components/data/DataSidebar.vue'
import DataContent from '../components/data/DataContent.vue'

const dataStore = useDataStore()
const { variables, tables, currentTableId, currentTable } = storeToRefs(dataStore)

// 初始化演示数据
onMounted(() => {
  dataStore.initDemoData()
})

// 工具栏事件处理
const handleAddVariable = () => {
  const name = prompt('请输入变量名称:')
  if (name && name.trim()) {
    try {
      dataStore.addVariable(name.trim(), FieldType.STRING, '')
    } catch (error) {
      console.error('添加变量失败:', error)
      alert('添加变量失败，请重试')
    }
  }
}

const handleAddTable = () => {
  const name = prompt('请输入数据表名称:')
  if (name) {
    const table = dataStore.addTable(name)
    dataStore.selectTable(table.id)
  }
}

const handleImport = () => {
  // TODO: 实现导入功能
  console.log('导入数据')
}

const handleExport = () => {
  // TODO: 实现导出功能
  console.log('导出数据')
}

// 侧边栏事件处理
const handleEditVariable = (id: string) => {
  // TODO: 实现变量编辑
  console.log('编辑变量:', id)
}

const handleEditTable = (id: string) => {
  // TODO: 实现表编辑
  console.log('编辑表:', id)
}

// 内容区事件处理
// 更精确的类型定义
const handleUpdateTable = (updates: Partial<Pick<DataTable, 'name' | 'description'>>) => {
  if (currentTableId.value) {
    dataStore.updateTable(currentTableId.value, updates)
  }
}

const handleUpdateField = (fieldId: string, updates: Partial<DataField>) => {
  if (currentTableId.value) {
    dataStore.updateField(currentTableId.value, fieldId, updates)
  }
}

const handleAddField = (name: string, type: FieldType) => {
  if (currentTableId.value) {
    dataStore.addField(currentTableId.value, name, type)
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

// Add missing method definitions
const selectTable = (tableId: string) => {
  dataStore.selectTable(tableId)
}

const deleteVariable = (variableId: string) => {
  dataStore.deleteVariable(variableId)
}

const deleteTable = (tableId: string) => {
  dataStore.deleteTable(tableId)
}
</script>
