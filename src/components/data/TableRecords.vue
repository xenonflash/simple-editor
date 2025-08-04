<template>
  <div class="table-records">
    <!-- 工具栏 -->
    <div class="records-toolbar">
      <n-button 
        type="primary" 
        @click="addNewRecord" 
        :disabled="table.fields.length === 0 || editingRowIndex !== null">
        <template #icon>
          <n-icon><AddOutline /></n-icon>
        </template>
        添加记录
      </n-button>
      <n-text v-if="table.fields.length === 0" depth="3">请先添加字段</n-text>
      <n-text v-else-if="editingRowIndex !== null" depth="3">请先完成当前编辑</n-text>
      <n-text v-else depth="3">共 {{ actualRecordsCount }} 条记录</n-text>
    </div>
    
    <!-- 数据表格 -->
    <div class="records-table">
      <n-data-table 
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :bordered="false"
        size="small"
        :scroll-x="scrollX" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { AddOutline, TrashOutline, CreateOutline, CheckmarkOutline, CloseOutline } from '@vicons/ionicons5'
import { NButton, NIcon, NInput, NInputNumber, NSwitch, NDatePicker, NText, useMessage } from 'naive-ui'
import type { DataTable } from '../../types/data'
import { FieldType } from '../../types/data'

const props = defineProps<{
  table: DataTable
}>()

const emit = defineEmits<{
  'add-record': [record: Record<string, any>]
  'update-record': [event: { index: number; updates: Record<string, any> }]
  'delete-record': [index: number]
}>()

const message = useMessage()
const editingRowIndex = ref<number | null>(null)
const editingData = ref<Record<string, any>>({})
const originalData = ref<Record<string, any>>({})
const pendingRecord = ref<Record<string, any> | null>(null)
const fieldErrors = ref<Record<string, boolean>>({})

// 计算实际记录数量（不包含 pending 记录）
const actualRecordsCount = computed(() => {
  return props.table.records.length
})

// 计算表格数据（包含 pending 记录）
const tableData = computed(() => {
  const records = [...props.table.records]
  
  // 如果有 pending 记录，添加到列表末尾
  if (pendingRecord.value) {
    records.push({
      ...pendingRecord.value,
      _isPending: true
    })
  }
  
  return records.map((record, index) => ({
    ...record,
    _index: index
  }))
})

// 计算表格列配置
const columns = computed(() => {
  const cols = props.table.fields.map(field => ({
    title: () => {
      return h('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } }, [
        field.required ? h('span', { style: { color: '#ff4d4f' } }, '*') : null,
        h('span', {}, field.name)
      ])
    },
    key: field.name,
    width: getColumnWidth(field.type),
    render: (row: any) => {
      const isEditing = editingRowIndex.value === row._index
      const value = isEditing ? editingData.value[field.name] : row[field.name]
      const hasError = fieldErrors.value[field.name] || false
      
      if (isEditing) {
        // 编辑状态：显示输入组件
        return h('div', {
          style: {
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            padding: '4px 0'
          }
        }, [
          h(getFieldComponent(field.type), {
            value: value,
            placeholder: field.required ? `*请输入${field.name}` : `请输入${field.name}`,
            size: 'small',
            status: hasError ? 'error' : undefined,
            style: { 
              width: '100%', 
              height: '32px'
            },
            onUpdateValue: (newValue: any) => {
              editingData.value[field.name] = newValue
              // 清除错误状态
              if (fieldErrors.value[field.name]) {
                fieldErrors.value[field.name] = false
              }
            },
            // 特殊属性处理
            ...(field.type === FieldType.DATE ? {
              type: 'date',
              format: 'yyyy-MM-dd'
            } : {}),
            ...(field.type === FieldType.BOOLEAN ? {
              size: 'small'
            } : {})
          })
        ])
      } else {
        // 显示状态：显示为文本
        const displayStyle = {
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          padding: '4px 12px',
          lineHeight: '32px',
          ...(row._isPending ? {
            opacity: 0.6,
            fontStyle: 'italic'
          } : {})
        }
        
        return h('div', { style: displayStyle }, [
          h(NText, {}, {
            default: () => row._isPending ? 
              `${formatDisplayValue(value, field.type)} (待保存)` : 
              formatDisplayValue(value, field.type)
          })
        ])
      }
    }
  }))
  
  // 添加操作列
  cols.push({
    title: '操作',
    key: 'actions',
    width: 160,
    fixed: 'right',
    render: (row: any) => {
      const isEditing = editingRowIndex.value === row._index
      
      return h('div', {
        class: 'record-actions',
        style: {
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px'
        }
      }, [
        // 编辑/确认按钮
        h(NButton, {
          size: 'small',
          quaternary: true,
          type: isEditing ? 'success' : 'primary',
          onClick: () => isEditing ? confirmEdit(row._index, row._isPending) : startEdit(row._index, row)
        }, {
          icon: () => h(NIcon, null, { 
            default: () => h(isEditing ? CheckmarkOutline : CreateOutline) 
          })
        }),
        // 取消按钮（仅编辑状态显示）
        isEditing ? h(NButton, {
          size: 'small',
          quaternary: true,
          type: 'warning',
          onClick: () => cancelEdit(row._isPending)
        }, {
          icon: () => h(NIcon, null, { default: () => h(CloseOutline) })
        }) : null,
        // 删除按钮
        h(NButton, {
          size: 'small',
          quaternary: true,
          type: 'error',
          disabled: isEditing,
          onClick: () => deleteRecord(row._index, row._isPending)
        }, {
          icon: () => h(NIcon, null, { default: () => h(TrashOutline) })
        })
      ])
    }
  })
  
  return cols
})

// 计算滚动宽度
const scrollX = computed(() => {
  const fieldWidth = props.table.fields.length * 150
  const actionWidth = 160
  return Math.max(fieldWidth + actionWidth, 600)
})

// 分页配置
const pagination = {
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
}

// 根据字段类型获取对应的输入组件
function getFieldComponent(type: FieldType) {
  switch (type) {
    case FieldType.NUMBER:
      return NInputNumber
    case FieldType.BOOLEAN:
      return NSwitch
    case FieldType.DATE:
      return NDatePicker
    default:
      return NInput
  }
}

// 根据字段类型获取列宽
function getColumnWidth(type: FieldType): number {
  switch (type) {
    case FieldType.BOOLEAN:
      return 80
    case FieldType.NUMBER:
      return 120
    case FieldType.DATE:
      return 140
    default:
      return 150
  }
}

// 格式化显示值
function formatDisplayValue(value: any, type: FieldType): string {
  if (value === null || value === undefined) return '-'
  
  switch (type) {
    case FieldType.BOOLEAN:
      return value ? '是' : '否'
    case FieldType.DATE:
      return value ? new Date(value).toLocaleDateString() : '-'
    case FieldType.NUMBER:
      return value.toString()
    default:
      return value.toString()
  }
}

// 开始编辑
function startEdit(index: number, row: any) {
  editingRowIndex.value = index
  originalData.value = { ...row }
  editingData.value = { ...row }
  fieldErrors.value = {}
}

// 确认编辑
function confirmEdit(index: number, isPending: boolean = false) {
  // 验证必填字段并设置错误状态
  const errors: Record<string, boolean> = {}
  let hasErrors = false
  
  props.table.fields.forEach(field => {
    if (field.required) {
      const value = editingData.value[field.name]
      if (value === null || value === undefined || value === '') {
        errors[field.name] = true
        hasErrors = true
      }
    }
  })
  
  if (hasErrors) {
    fieldErrors.value = errors
    return
  }
  
  const updates = { ...editingData.value }
  delete updates._index
  delete updates._isPending
  
  if (isPending) {
    // 如果是 pending 记录，实际添加到数据中
    emit('add-record', updates)
    pendingRecord.value = null
    message.success('记录添加成功')
  } else {
    // 如果是编辑已有记录
    emit('update-record', { index, updates })
    message.success('记录更新成功')
  }
  
  // 重置编辑状态
  editingRowIndex.value = null
  editingData.value = {}
  originalData.value = {}
  fieldErrors.value = {}
}

// 取消编辑
function cancelEdit(isPending: boolean = false) {
  if (isPending) {
    // 如果是 pending 记录，直接删除
    pendingRecord.value = null
    message.info('已取消添加记录')
  } else {
    // 如果是编辑已有记录，恢复原始数据
    const updates = { ...originalData.value }
    delete updates._index
    emit('update-record', { index: editingRowIndex.value!, updates })
    message.info('已取消编辑')
  }
  
  // 重置编辑状态
  editingRowIndex.value = null
  editingData.value = {}
  originalData.value = {}
  fieldErrors.value = {}
}

// 添加新记录
function addNewRecord() {
  const newRecord: Record<string, any> = {}
  
  // 根据字段设置默认值
  props.table.fields.forEach(field => {
    newRecord[field.name] = field.defaultValue || getDefaultValueByType(field.type)
  })
  
  // 设置为 pending 状态
  pendingRecord.value = newRecord
  
  // 立即进入编辑状态
  setTimeout(() => {
    const newIndex = tableData.value.length - 1
    editingRowIndex.value = newIndex
    editingData.value = { ...newRecord }
    originalData.value = {}
    fieldErrors.value = {}
  }, 50)
}

// 根据类型获取默认值
function getDefaultValueByType(type: FieldType): any {
  switch (type) {
    case FieldType.NUMBER:
      return 0
    case FieldType.BOOLEAN:
      return false
    case FieldType.DATE:
      return Date.now()
    default:
      return ''
  }
}

// 删除记录
function deleteRecord(index: number, isPending: boolean = false) {
  if (isPending) {
    // 如果是 pending 记录，直接删除
    pendingRecord.value = null
    message.success('已删除待添加记录')
  } else {
    // 如果是已有记录
    emit('delete-record', index)
    message.success('记录删除成功')
  }
}
</script>

<style scoped>
.table-records {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.records-toolbar {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.records-table {
  flex: 1;
  overflow: hidden;
}

:deep(.n-data-table-th) {
  background: #fafafa;
  font-weight: 600;
  height: 44px;
}

:deep(.n-data-table-td) {
  padding: 0;
  height: 40px;
}

:deep(.n-data-table-tr) {
  height: 40px;
}

:deep(.n-input),
:deep(.n-input-number),
:deep(.n-date-picker) {
  height: 32px;
}

:deep(.n-input .n-input__input-el),
:deep(.n-input-number .n-input__input-el) {
  height: 30px;
  line-height: 30px;
}

/* 错误状态样式 */
:deep(.n-input.n-input--error),
:deep(.n-input-number.n-input-number--error) {
  border-color: #ff4d4f;
}

:deep(.n-input.n-input--error .n-input__border),
:deep(.n-input-number.n-input-number--error .n-input__border) {
  border-color: #ff4d4f;
}
</style>