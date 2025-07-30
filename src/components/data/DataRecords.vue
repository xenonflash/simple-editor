<template>
  <div class="data-records">
    <div class="records-header">
      <div class="header-info">
        <h3 class="records-title">数据记录</h3>
        <span class="records-count">{{ records.length }} 条记录</span>
      </div>
      <button class="btn btn-primary" @click="addRecord">
        <span class="btn-icon">+</span>
        <span class="btn-text">添加记录</span>
      </button>
    </div>

    <div class="records-content">
      <div v-if="fields.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p class="empty-text">请先在字段设计页面添加字段</p>
      </div>
      <div v-else-if="records.length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <p class="empty-text">暂无数据记录，点击上方按钮添加第一条记录</p>
      </div>
      <div v-else class="table-container">
        <table class="records-table">
          <thead>
            <tr>
              <th class="row-number">#</th>
              <th v-for="field in fields" :key="field.id" :class="getFieldClass(field)">
                <div class="header-content">
                  <span class="field-name">{{ field.name }}</span>
                  <span v-if="field.required" class="required-mark">*</span>
                </div>
                <div class="field-type">{{ getFieldTypeLabel(field.type) }}</div>
              </th>
              <th class="actions-header">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(record, index) in records" :key="index" class="record-row">
              <td class="row-number">{{ index + 1 }}</td>
              <td v-for="field in fields" :key="field.id" class="record-cell">
                <component 
                  :is="getInputComponent(field.type)"
                  v-model="record[field.name]"
                  :type="getInputType(field.type)"
                  :class="getInputClass(field)"
                  :placeholder="getPlaceholder(field)"
                  @blur="updateRecord(index, record)"
                  @change="updateRecord(index, record)"
                />
              </td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <button 
                    class="action-btn duplicate"
                    @click="duplicateRecord(index)"
                    title="复制记录"
                  >
                    📋
                  </button>
                  <button 
                    class="action-btn delete"
                    @click="deleteRecord(index)"
                    title="删除记录"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DataField } from '../../types/data'
import { FieldType } from '../../types/data'

interface Props {
  fields: DataField[]
  records: Record<string, any>[]
}

defineProps<Props>()

const emit = defineEmits<{
  addRecord: [record: Record<string, any>]
  updateRecord: [event: { index: number; updates: any }]
  deleteRecord: [index: number]
}>()

const addRecord = () => {
  const newRecord: Record<string, any> = {}
  // 为每个字段设置默认值
  // 实现逻辑...
  emit('addRecord', newRecord)
}

const updateRecord = (index: number, record: Record<string, any>) => {
  emit('updateRecord', { index, updates: record })
}

const duplicateRecord = (index: number) => {
  // 实现复制逻辑...
}

const deleteRecord = (index: number) => {
  if (confirm('确定要删除这条记录吗？')) {
    emit('deleteRecord', index)
  }
}

// 其他辅助方法...
const getFieldClass = (field: DataField) => {
  return {
    'field-required': field.required,
    [`field-${field.type}`]: true
  }
}

const getFieldTypeLabel = (type: FieldType): string => {
  const labels = {
    [FieldType.STRING]: '文本',
    [FieldType.NUMBER]: '数字',
    [FieldType.BOOLEAN]: '布尔值',
    [FieldType.DATE]: '日期',
    [FieldType.JSON]: 'JSON'
  }
  return labels[type] || '未知'
}

const getInputComponent = (type: FieldType) => {
  switch (type) {
    case FieldType.BOOLEAN:
      return 'input'
    case FieldType.DATE:
      return 'input'
    default:
      return 'input'
  }
}

const getInputType = (type: FieldType) => {
  switch (type) {
    case FieldType.NUMBER:
      return 'number'
    case FieldType.DATE:
      return 'date'
    case FieldType.BOOLEAN:
      return 'checkbox'
    default:
      return 'text'
  }
}

const getInputClass = (field: DataField) => {
  return {
    'form-input': true,
    'required': field.required,
    [`input-${field.type}`]: true
  }
}

const getPlaceholder = (field: DataField) => {
  return field.description || `请输入${field.name}`
}
</script>

<style scoped>
.data-records {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.records-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.records-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.records-count {
  background: #e8f4fd;
  color: #1976d2;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd8;
}

.btn-icon {
  font-size: 14px;
}

.records-content {
  flex: 1;
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  padding: 40px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 14px;
  margin: 0;
  text-align: center;
}

.table-container {
  height: 100%;
  overflow: auto;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.records-table th,
.records-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.records-table th {
  background: #fafafa;
  font-weight: 600;
  color: #555;
  position: sticky;
  top: 0;
  z-index: 10;
}

.row-number {
  width: 60px;
  text-align: center;
  color: #999;
  font-weight: 500;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.field-name {
  font-weight: 600;
  color: #2c3e50;
}

.required-mark {
  color: #d32f2f;
  font-weight: bold;
}

.field-type {
  font-size: 11px;
  color: #999;
  font-weight: normal;
}

.actions-header {
  width: 100px;
  text-align: center;
}

.record-row:hover {
  background: #f8f9fa;
}

.record-cell {
  padding: 8px 12px;
}

.form-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.actions-cell {
  text-align: center;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.action-btn {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.action-btn:hover {
  background: #f0f0f0;
}

.action-btn.delete:hover {
  background: #ffebee;
}
</style>