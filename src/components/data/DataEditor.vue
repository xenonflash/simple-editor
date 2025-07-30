<template>
  <div class="data-editor">
    <!-- Tab 导航 -->
    <div class="tab-nav">
      <button 
        :class="['tab-btn', { active: activeTab === 'schema' }]"
        @click="activeTab = 'schema'"
      >
        <span class="tab-icon">🏗️</span>
        <span class="tab-text">字段设计</span>
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'data' }]"
        @click="activeTab = 'data'"
      >
        <span class="tab-icon">📊</span>
        <span class="tab-text">数据记录</span>
        <span class="tab-badge">{{ records.length }}</span>
      </button>
    </div>

    <!-- Tab 内容 -->
    <div class="tab-content">
      <!-- 字段设计页面 -->
      <div v-show="activeTab === 'schema'" class="tab-panel">
        <SchemaEditor 
          :table="table"
          @update-table="$emit('updateTable', $event)"
          @add-field="handleAddField"
          @update-field="handleUpdateField"
          @delete-field="$emit('deleteField', $event)"
        />
      </div>

      <!-- 数据记录页面 -->
      <div v-show="activeTab === 'data'" class="tab-panel">
        <DataRecords 
          :fields="fields"
          :records="records"
          @add-record="$emit('addRecord', $event)"
          @update-record="handleUpdateRecord"
          @delete-record="$emit('deleteRecord', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { DataTable, DataField } from '../../types/data'
import SchemaEditor from './SchemaEditor.vue'
import DataRecords from './DataRecords.vue'

interface Props {
  table: DataTable
  fields: DataField[]
  records: Record<string, any>[]
}

defineProps<Props>()

// Assign defineEmits to a variable
const emit = defineEmits<{
  updateTable: [updates: any]
  addField: [event: { name: string; type: any }]
  updateField: [event: { fieldId: string; updates: any }]
  deleteField: [fieldId: string]
  addRecord: [record: Record<string, any>]
  updateRecord: [event: { index: number; updates: any }]
  deleteRecord: [index: number]
}>()

const activeTab = ref<'schema' | 'data'>('schema')

// Add these method handlers
function handleAddField(event: { name: string; type: string }) {
  emit('addField', event)
}

function handleUpdateField(event: { fieldId: string; updates: any }) {
  emit('updateField', event)
}

function handleUpdateRecord(event: { index: number; updates: any }) {
  emit('updateRecord', event)
}
</script>

<style scoped>
.data-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
}

.tab-nav {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
  padding: 0 16px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  background: none;
  color: #666;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px 6px 0 0;
  transition: all 0.2s ease;
  position: relative;
}

.tab-btn:hover {
  color: #333;
  background: rgba(102, 126, 234, 0.08);
}

.tab-btn.active {
  color: #667eea;
  background: white;
  border-bottom: 2px solid #667eea;
}

.tab-icon {
  font-size: 14px;
}

.tab-text {
  font-weight: 500;
}

.tab-badge {
  background: #667eea;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.tab-content {
  flex: 1;
  overflow: hidden;
}

.tab-panel {
  height: 100%;
  overflow-y: auto;
}
</style>