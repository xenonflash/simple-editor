<template>
  <div class="table-editor">
    <!-- 表信息编辑 -->
    <div class="table-header">
      <div class="table-info">
        <input 
          v-model="tableInfo.name"
          class="table-name-input"
          placeholder="数据表名称"
          @blur="updateTableInfo"
        />
        <textarea 
          v-model="tableInfo.description"
          class="table-description-input"
          placeholder="数据表描述（可选）"
          @blur="updateTableInfo"
        />
      </div>
      
      <div class="table-actions">
        <button class="btn btn-primary" @click="showAddFieldDialog = true">
          <span class="icon">➕</span>
          添加字段
        </button>
      </div>
    </div>
    
    <!-- 字段管理 -->
    <div class="fields-section">
      <h4>字段定义 ({{ table.fields.length }})</h4>
      <div class="fields-list">
        <div 
          v-for="field in table.fields" 
          :key="field.id"
          class="field-item"
        >
          <div class="field-info">
            <span class="field-name">{{ field.name }}</span>
            <span class="field-type">{{ getFieldTypeLabel(field.type) }}</span>
            <span v-if="field.required" class="field-required">必填</span>
            <span v-if="field.description" class="field-description">{{ field.description }}</span>
          </div>
          <div class="field-actions">
            <button 
              class="action-btn edit"
              @click="editField(field)"
              title="编辑字段"
            >
              ✏️
            </button>
            <button 
              class="action-btn delete"
              @click="$emit('deleteField', field.id)"
              title="删除字段"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div v-if="table.fields.length === 0" class="no-fields">
          <p>暂无字段定义</p>
          <small>点击"添加字段"按钮创建第一个字段</small>
        </div>
      </div>
    </div>
    
    <!-- 添加字段对话框 -->
    <div v-if="showAddFieldDialog" class="dialog-overlay" @click="showAddFieldDialog = false">
      <div class="dialog" @click.stop>
        <h3>{{ editingField ? '编辑字段' : '添加字段' }}</h3>
        <form @submit.prevent="saveField">
          <div class="form-group">
            <label>字段名称 *</label>
            <input v-model="fieldForm.name" type="text" required />
          </div>
          
          <div class="form-group">
            <label>字段类型 *</label>
            <select v-model="fieldForm.type">
              <option value="string">文本 (String)</option>
              <option value="number">数字 (Number)</option>
              <option value="boolean">布尔值 (Boolean)</option>
              <option value="date">日期 (Date)</option>
              <option value="json">JSON 对象</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>默认值</label>
            <input 
              v-model="fieldForm.defaultValue" 
              :type="getInputType(fieldForm.type)"
              :placeholder="getDefaultPlaceholder(fieldForm.type)"
            />
          </div>
          
          <div class="form-group">
            <label>字段描述</label>
            <input v-model="fieldForm.description" type="text" placeholder="可选的字段说明" />
          </div>
          
          <div class="form-group">
            <label class="checkbox-label">
              <input v-model="fieldForm.required" type="checkbox" />
              必填字段
            </label>
          </div>
          
          <div class="form-actions">
            <button type="button" @click="cancelEdit">取消</button>
            <button type="submit" class="btn btn-primary">
              {{ editingField ? '保存' : '添加' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { DataTable, DataField } from '../../types/data'
import { FieldType } from '../../types/data'

interface Props {
  table: DataTable
}

const props = defineProps<Props>()

const emit = defineEmits<{
  updateTable: [updates: any]
  addField: [name: string, type: FieldType, options: any]
  updateField: [fieldId: string, updates: any]
  deleteField: [fieldId: string]
}>()

const showAddFieldDialog = ref(false)
const editingField = ref<DataField | null>(null)

const tableInfo = reactive({
  name: '',
  description: ''
})

const fieldForm = reactive({
  name: '',
  type: FieldType.STRING,
  required: false,
  defaultValue: '',
  description: ''
})

// 监听表变化，更新表信息
watch(() => props.table, (table) => {
  if (table) {
    tableInfo.name = table.name
    tableInfo.description = table.description || ''
  }
}, { immediate: true })

const updateTableInfo = () => {
  emit('updateTable', {
    name: tableInfo.name,
    description: tableInfo.description
  })
}

const getFieldTypeLabel = (type: string) => {
  const labels = {
    string: '文本',
    number: '数字',
    boolean: '布尔值',
    date: '日期',
    json: 'JSON'
  }
  return labels[type as keyof typeof labels] || type
}

const getInputType = (fieldType: string) => {
  switch (fieldType) {
    case 'number': return 'number'
    case 'date': return 'date'
    case 'boolean': return 'checkbox'
    default: return 'text'
  }
}

const getDefaultPlaceholder = (fieldType: string) => {
  switch (fieldType) {
    case 'string': return '默认文本值'
    case 'number': return '0'
    case 'boolean': return 'true/false'
    case 'date': return '2024-01-01'
    case 'json': return '{}'
    default: return ''
  }
}

const editField = (field: DataField) => {
  editingField.value = field
  fieldForm.name = field.name
  fieldForm.type = field.type
  fieldForm.required = field.required
  fieldForm.defaultValue = field.defaultValue || ''
  fieldForm.description = field.description || ''
  showAddFieldDialog.value = true
}

const saveField = () => {
  if (!fieldForm.name.trim()) return
  
  const fieldData = {
    name: fieldForm.name.trim(),
    type: fieldForm.type,
    required: fieldForm.required,
    defaultValue: fieldForm.defaultValue,
    description: fieldForm.description
  }
  
  if (editingField.value) {
    emit('updateField', editingField.value.id, fieldData)
  } else {
    emit('addField', fieldData.name, fieldData.type, fieldData)
  }
  
  cancelEdit()
}

const cancelEdit = () => {
  showAddFieldDialog.value = false
  editingField.value = null
  fieldForm.name = ''
  fieldForm.type = FieldType.STRING
  fieldForm.required = false
  fieldForm.defaultValue = ''
  fieldForm.description = ''
}
</script>

<style scoped>
.table-editor {
  padding: 24px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.table-info {
  flex: 1;
  margin-right: 16px;
}

.table-name-input {
  width: 100%;
  font-size: 20px;
  font-weight: 600;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 4px 0;
  margin-bottom: 8px;
  transition: border-color 0.2s ease;
}

.table-name-input:focus {
  outline: none;
  border-bottom-color: #1890ff;
}

.table-description-input {
  width: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 8px;
  resize: vertical;
  min-height: 60px;
}

.fields-section {
  margin-bottom: 32px;
}

.fields-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.field-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-bottom: 8px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.field-item:hover {
  background: #f0f9ff;
  border-color: #91d5ff;
}

.field-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.field-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.field-type {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.field-required {
  background: #fff2f0;
  color: #ff4d4f;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.field-description {
  color: #666;
  font-size: 12px;
  font-style: italic;
}

.field-actions {
  display: flex;
  gap: 4px;
}

.no-fields {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
}

.no-fields p {
  margin: 0 0 4px 0;
  font-size: 14px;
}

.no-fields small {
  font-size: 12px;
  color: #ccc;
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
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.2s ease;
}

.action-btn.edit {
  background: #f0f0f0;
  color: #666;
}

.action-btn.edit:hover {
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

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 480px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1890ff;
}

.form-group input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}

.form-actions button {
  padding: 8px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.form-actions button:hover {
  border-color: #1890ff;
  color: #1890ff;
}
</style>