<template>

<div class="schema-editor">
    <div class="editor-layout">
      <!-- 左侧：基本信息 -->
      <div class="left-panel">
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">基本信息</h3>
          </div>
          <div class="section-content">
            <div class="form-row">
              <label class="form-label">表名称</label>
              <input 
                v-model="tableInfo.name"
                class="form-input"
                placeholder="请输入数据表名称"
                @blur="updateTableInfo"
              />
            </div>
            <div class="form-row">
              <label class="form-label">描述</label>
              <textarea 
                v-model="tableInfo.description"
                class="form-textarea"
                placeholder="请输入数据表描述（可选）"
                rows="4"
                @blur="updateTableInfo"
              />
            </div>
            <div class="form-row">
              <label class="form-label">统计信息</label>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">字段数量</span>
                  <span class="stat-value">{{ table.fields.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">记录数量</span>
                  <span class="stat-value">{{ table.records?.length || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">创建时间</span>
                  <span class="stat-value">{{ formatDate(table.createdAt) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">更新时间</span>
                  <span class="stat-value">{{ formatDate(table.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：字段定义 -->
      <div class="right-panel">
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">字段定义</h3>
            <button class="btn btn-primary" @click="showAddFieldDialog = true">
              <span class="btn-icon">+</span>
              <span class="btn-text">添加字段</span>
            </button>
          </div>
          <div class="section-content">
            <div v-if="table.fields.length === 0" class="empty-state">
              <div class="empty-icon">📝</div>
              <p class="empty-text">暂无字段，点击上方按钮添加第一个字段</p>
            </div>
            <div v-else class="fields-list">
              <div 
                v-for="field in table.fields" 
                :key="field.id"
                class="field-card"
              >
                <div class="field-header">
                  <div class="field-name">{{ field.name }}</div>
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
                      @click="deleteField(field.id)"
                      title="删除字段"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div class="field-meta">
                  <span class="field-type">{{ getFieldTypeLabel(field.type) }}</span>
                  <span v-if="field.required" class="field-required">必填</span>
                </div>
                <div v-if="field.description" class="field-description">
                  {{ field.description }}
                </div>
                <div v-if="field.defaultValue" class="field-default">
                  <span class="default-label">默认值:</span>
                  <span class="default-value">{{ field.defaultValue }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加字段对话框 -->
    <div v-if="showAddFieldDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>添加字段</h3>
          <button class="dialog-close" @click="closeDialog">×</button>
        </div>
        <div class="dialog-content">
          <div class="form-row">
            <label class="form-label">字段名称</label>
            <input 
              v-model="newField.name"
              class="form-input"
              placeholder="请输入字段名称"
            />
          </div>
          <div class="form-row">
            <label class="form-label">字段类型</label>
            <select v-model="newField.type" class="form-select">
              <option value="string">文本</option>
              <option value="number">数字</option>
              <option value="boolean">布尔值</option>
              <option value="date">日期</option>
              <option value="json">JSON</option>
            </select>
          </div>
          <div class="form-row">
            <label class="form-label">描述</label>
            <input 
              v-model="newField.description"
              class="form-input"
              placeholder="请输入字段描述（可选）"
            />
          </div>
          <div class="form-row">
            <label class="form-label">默认值</label>
            <input 
              v-model="newField.defaultValue"
              class="form-input"
              placeholder="请输入默认值（可选）"
            />
          </div>
          <div class="form-row">
            <label class="form-checkbox">
              <input 
                v-model="newField.required"
                type="checkbox"
              />
              <span class="checkbox-text">必填字段</span>
            </label>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="closeDialog">取消</button>
          <button class="btn btn-primary" @click="addField">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { DataTable, DataField } from '../../types/data'
import { FieldType } from '../../types/data'

interface Props {
  table: DataTable
}

const props = defineProps<Props>()

const emit = defineEmits<{
  updateTable: [updates: any]
  addField: [event: { name: string; type: FieldType }]
  updateField: [event: { fieldId: string; updates: any }]
  deleteField: [fieldId: string]
}>()

const tableInfo = reactive({
  name: props.table.name,
  description: props.table.description || ''
})

const showAddFieldDialog = ref(false)
const newField = reactive({
  name: '',
  type: FieldType.STRING,
  description: '',
  defaultValue: '',
  required: false
})

const updateTableInfo = () => {
  emit('updateTable', {
    name: tableInfo.name,
    description: tableInfo.description
  })
}

const addField = () => {
  if (newField.name.trim()) {
    emit('addField', {
      name: newField.name.trim(),
      type: newField.type
    })
    closeDialog()
  }
}

const editField = (field: DataField) => {
  // TODO: 实现字段编辑
  console.log('编辑字段:', field)
}

const deleteField = (fieldId: string) => {
  if (confirm('确定要删除这个字段吗？')) {
    emit('deleteField', fieldId)
  }
}

const closeDialog = () => {
  showAddFieldDialog.value = false
  Object.assign(newField, {
    name: '',
    type: FieldType.STRING,
    description: '',
    defaultValue: '',
    required: false
  })
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

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.schema-editor {
  height: 100%;
  overflow: hidden;
}

.editor-layout {
  display: flex;
  height: 100%;
  gap: 1px;
  background: #f0f0f0;
}

.left-panel {
  width: 320px;
  background: white;
  overflow-y: auto;
  flex-shrink: 0;
  min-width: 0; /* 防止flex子元素溢出 */
}

.section-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  min-width: 0; /* 防止flex子元素溢出 */
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  max-width: 100%; /* 防止溢出 */
  box-sizing: border-box; /* 确保padding包含在宽度内 */
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  transition: border-color 0.2s ease;
}

.form-row {
  margin-bottom: 20px;
  min-width: 0; /* 防止flex子元素溢出 */
}

.right-panel {
  flex: 1;
  background: white;
  overflow-y: auto;
}

.section {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  flex-shrink: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.section-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.form-row {
  margin-bottom: 20px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-bottom: 8px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-text {
  font-size: 13px;
  color: #555;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
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

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.btn-secondary:hover {
  background: #e8e8e8;
}

.btn-icon {
  font-size: 14px;
}

.btn-text {
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-card {
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.field-card:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
  background: white;
}

.field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.field-name {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
}

.field-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  background: none;
  border: none;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s ease;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.field-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.field-type {
  background: #e8f4fd;
  color: #1976d2;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.field-required {
  background: #ffebee;
  color: #d32f2f;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.field-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 6px;
}

.field-default {
  font-size: 12px;
  color: #666;
}

.default-label {
  color: #999;
}

.default-value {
  color: #667eea;
  font-weight: 500;
}

/* 对话框样式保持不变 */
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
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.dialog-close:hover {
  background: #f0f0f0;
}

.dialog-content {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}
</style>