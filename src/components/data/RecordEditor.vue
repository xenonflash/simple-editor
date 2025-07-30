<template>
  <div class="record-editor">
    <div class="records-header">
      <h4>数据记录 ({{ records.length }})</h4>
      <button class="btn btn-primary" @click="addRecord">
        <span class="icon">➕</span>
        添加记录
      </button>
    </div>
    
    <div class="records-table">
      <table v-if="fields.length > 0">
        <thead>
          <tr>
            <th v-for="field in fields" :key="field.id" :class="getFieldClass(field)">
              {{ field.name }}
              <span v-if="field.required" class="required-mark">*</span>
            </th>
            <th width="100" class="actions-header">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(record, index) in records" :key="index" class="record-row">
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
                ✕
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-else class="no-fields">
        <div class="empty-icon">📋</div>
        <p>请先添加字段定义</p>
        <small>在上方的"字段定义"区域添加字段后，就可以开始录入数据了</small>
      </div>
      
      <div v-if="fields.length > 0 && records.length === 0" class="no-records">
        <div class="empty-icon">📝</div>
        <p>暂无数据记录</p>
        <small>点击"添加记录"按钮创建第一条记录</small>
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

const props = defineProps<Props>()

const emit = defineEmits<{
  addRecord: [record: Record<string, any>]
  updateRecord: [index: number, updates: Record<string, any>]
  deleteRecord: [index: number]
}>()

const getInputComponent = (fieldType: string) => {
  switch (fieldType) {
    case 'boolean': return 'input'
    default: return 'input'
  }
}

const getInputType = (fieldType: string) => {
  switch (fieldType) {
    case 'number': return 'number'
    case 'date': return 'date'
    case 'boolean': return 'checkbox'
    default: return 'text'
  }
}

const getInputClass = (field: DataField) => {
  return [
    'record-input',
    `input-${field.type}`,
    { 'required': field.required }
  ]
}

const getFieldClass = (field: DataField) => {
  return [
    'field-header',
    `field-${field.type}`,
    { 'required': field.required }
  ]
}

const getPlaceholder = (field: DataField) => {
  if (field.defaultValue !== undefined && field.defaultValue !== null) {
    return String(field.defaultValue)
  }
  
  switch (field.type) {
    case FieldType.STRING: return '输入文本...'
    case FieldType.NUMBER: return '0'
    case FieldType.DATE: return '选择日期'
    case FieldType.JSON: return '{}'
    default: return ''
  }
}

const addRecord = () => {
  const newRecord: Record<string, any> = {}
  props.fields.forEach(field => {
    newRecord[field.name] = field.defaultValue ?? getDefaultValue(field.type)
  })
  
  emit('addRecord', newRecord)
}

const updateRecord = (index: number, record: Record<string, any>) => {
  emit('updateRecord', index, record)
}

const deleteRecord = (index: number) => {
  if (confirm('确定要删除这条记录吗？')) {
    emit('deleteRecord', index)
  }
}

const duplicateRecord = (index: number) => {
  const originalRecord = props.records[index]
  const duplicatedRecord = { ...originalRecord }
  
  // 移除 id 字段，让系统重新生成
  delete duplicatedRecord.id
  
  emit('addRecord', duplicatedRecord)
}

const getDefaultValue = (fieldType: string) => {
  switch (fieldType) {
    case FieldType.STRING: return ''
    case FieldType.NUMBER: return 0
    case FieldType.BOOLEAN: return false
    case FieldType.DATE: return new Date().toISOString().split('T')[0]
    case FieldType.JSON: return {}
    default: return null
  }
}
</script>

<style scoped>
.record-editor {
  margin-top: 32px;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.records-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.records-table {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
  background: white;
}

.records-table table {
  width: 100%;
  border-collapse: collapse;
}

.records-table th,
.records-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e8e8e8;
}

.records-table th {
  background: #fafafa;
  font-weight: 600;
  color: #333;
  font-size: 14px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.field-header.required {
  background: #fff7e6;
}

.required-mark {
  color: #ff4d4f;
  margin-left: 2px;
}

.actions-header {
  text-align: center;
}

.record-row:hover {
  background: #f9f9f9;
}

.record-cell {
  padding: 8px 12px;
}

.record-input {
  width: 100%;
  border: 1px solid transparent;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: transparent;
}

.record-input:focus {
  outline: none;
  border-color: #1890ff;
  background: white;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.record-input.required {
  border-left: 3px solid #ff4d4f;
}

.input-number {
  text-align: right;
}

.input-boolean {
  width: auto;
  margin: 0 auto;
  display: block;
}

.actions-cell {
  text-align: center;
  padding: 8px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin: 0 2px;
  transition: all 0.2s ease;
}

.action-btn.duplicate {
  background: #f0f9ff;
  color: #1890ff;
}

.action-btn.duplicate:hover {
  background: #1890ff;
  color: white;
}

.action-btn.delete {
  background: #fff2f0;
  color: #ff4d4f;
}

.action-btn.delete:hover {
  background: #ff4d4f;
  color: white;
}

.no-fields,
.no-records {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-fields p,
.no-records p {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #666;
}

.no-fields small,
.no-records small {
  font-size: 14px;
  color: #999;
  line-height: 1.4;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
  transform: translateY(-1px);
}

.icon {
  font-size: 14px;
}
</style>