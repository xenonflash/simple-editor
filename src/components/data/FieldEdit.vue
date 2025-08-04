<template>
  <div class="field-edit">
    <!-- 工具栏 -->
    <div class="field-toolbar">
      <n-button type="primary" @click="addNewField">
        <template #icon>
          <n-icon><AddOutline /></n-icon>
        </template>
        添加字段
      </n-button>
    </div>
    
    <!-- 字段表格 -->
    <div class="field-table">
      <n-data-table 
        :columns="columns"
        :data="fieldData"
        :pagination="false"
        :bordered="false"
        size="small" />
    </div>
    
    <!-- 添加字段对话框 -->
    <n-modal v-model:show="showAddField" preset="dialog" title="添加字段">
      <n-form ref="formRef" :model="newField" :rules="fieldRules" label-placement="left" label-width="80">
        <n-form-item label="字段名称" path="name">
          <n-input v-model:value="newField.name" placeholder="请输入字段名称" />
        </n-form-item>
        <n-form-item label="字段类型" path="type">
          <n-select v-model:value="newField.type" :options="fieldTypeOptions" @update:value="handleTypeChange" />
        </n-form-item>
        <n-form-item label="是否必填">
          <n-switch v-model:value="newField.required" />
        </n-form-item>
        <n-form-item label="默认值">
          <n-input 
            v-if="newField.type === FieldTypeEnum.STRING"
            v-model:value="newField.defaultValue"
            placeholder="请输入默认值" />
          <n-input-number 
            v-else-if="newField.type === FieldTypeEnum.NUMBER"
            v-model:value="newField.defaultValue"
            placeholder="请输入默认数字"
            style="width: 100%" />
          <n-switch 
            v-else-if="newField.type === FieldTypeEnum.BOOLEAN"
            v-model:value="newField.defaultValue" />
          <n-date-picker 
            v-else-if="newField.type === FieldTypeEnum.DATE"
            v-model:value="newField.defaultValue"
            type="date"
            format="yyyy-MM-dd"
            style="width: 100%" />
          <n-input 
            v-else
            v-model:value="newField.defaultValue"
            placeholder="请输入默认值" />
        </n-form-item>
        <n-form-item label="描述" path="description">
          <n-input v-model:value="newField.description" placeholder="字段描述（可选）" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button @click="showAddField = false">取消</n-button>
        <n-button type="primary" @click="handleAddField">确定</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h } from 'vue'
import { AddOutline, TrashOutline, CreateOutline, CheckmarkOutline } from '@vicons/ionicons5'
import { NButton, NIcon, NInput, NSelect, NText, useMessage } from 'naive-ui'
import type { DataTable, DataField, FieldType } from '../../types/data'
import { FieldType as FieldTypeEnum } from '../../types/data'
import { format } from 'date-fns'

const props = defineProps<{
  table: DataTable
}>()

const emit = defineEmits<{
  'update-table': [updates: Partial<Pick<DataTable, 'name' | 'description'>>]
  'add-field': [event: { name: string; type: FieldType }]
  'update-field': [event: { id: string; updates: Partial<DataField> }]
  'delete-field': [fieldId: string]
}>()

const message = useMessage()
const showAddField = ref(false)
const formRef = ref()
const editingFieldId = ref<string | null>(null)
const editingData = ref<Partial<DataField>>({})

const newField = reactive({
  name: '',
  type: FieldTypeEnum.STRING,
  required: false,
  defaultValue: '',
  description: ''
})

const fieldRules = {
  name: {
    required: true,
    message: '请输入字段名称',
    trigger: 'blur'
  }
}

const fieldTypeOptions = [
  { label: '文本', value: FieldTypeEnum.STRING },
  { label: '数字', value: FieldTypeEnum.NUMBER },
  { label: '布尔值', value: FieldTypeEnum.BOOLEAN },
  { label: '日期', value: FieldTypeEnum.DATE },
  { label: 'JSON', value: FieldTypeEnum.JSON }
]

// 计算字段数据
const fieldData = computed(() => {
  return props.table.fields.map(field => ({
    ...field,
    _id: field.id
  }))
})

// 计算表格列配置
const columns = computed(() => [
  {
    title: '字段名称',
    key: 'name',
    width: 120,
    render: (row: DataField) => {
      const isEditing = editingFieldId.value === row.id
      
      if (isEditing) {
        return h('div', {
          style: {
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            padding: '4px 0'
          }
        }, [
          h(NInput, {
            value: editingData.value.name || row.name,
            placeholder: '请输入字段名称',
            size: 'small',
            style: { width: '100%', height: '32px' },
            onUpdateValue: (value: string) => {
              editingData.value.name = value
            }
          })
        ])
      } else {
        return h('div', {
          style: {
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            padding: '4px 12px',
            lineHeight: '32px'
          }
        }, [
          h(NText, {
            style: { fontWeight: '500' }
          }, {
            default: () => row.name
          })
        ])
      }
    }
  },
  {
    title: '字段类型',
    key: 'type',
    width: 100,
    render: (row: DataField) => {
      const isEditing = editingFieldId.value === row.id
      
      if (isEditing) {
        return h('div', {
          style: {
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            padding: '4px 0'
          }
        }, [
          h(NSelect, {
            value: editingData.value.type || row.type,
            options: fieldTypeOptions,
            size: 'small',
            style: { width: '100%', height: '32px' },
            onUpdateValue: (value: FieldType) => {
              editingData.value.type = value
            }
          })
        ])
      } else {
        return h('div', {
          style: {
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            padding: '4px 12px',
            lineHeight: '32px'
          }
        }, [
          h(NText, {}, {
            default: () => getFieldTypeLabel(row.type)
          })
        ])
      }
    }
  },
  {
    title: '必填',
    key: 'required',
    width: 60,
    render: (row: DataField) => {
      const isEditing = editingFieldId.value === row.id
      
      if (isEditing) {
        return h('div', {
          style: {
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 0'
          }
        }, [
          h(NSwitch, {
            value: editingData.value.required ?? row.required,
            size: 'small',
            onUpdateValue: (value: boolean) => {
              editingData.value.required = value
            }
          })
        ])
      } else {
        return h('div', {
          style: {
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 12px',
            lineHeight: '32px'
          }
        }, [
          h(NText, {
            style: { color: row.required ? '#18a058' : '#d03050' }
          }, {
            default: () => row.required ? '是' : '否'
          })
        ])
      }
    }
  },
  {
    title: '默认值',
    key: 'defaultValue',
    width: 120,
    render: (row: DataField) => {
      const isEditing = editingFieldId.value === row.id
      
      if (isEditing) {
        return h('div', {
          style: {
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            padding: '4px 0'
          }
        }, [
          h(getDefaultValueComponent(row.type), {
            value: editingData.value.defaultValue ?? row.defaultValue,
            placeholder: getDefaultValuePlaceholder(row.type),
            size: 'small',
            style: { width: '100%', height: '32px' },
            onUpdateValue: (value: any) => {
              editingData.value.defaultValue = value
            },
            ...(row.type === FieldType.DATE ? {
              type: 'date',
              format: 'yyyy-MM-dd'
            } : {})
          })
        ])
      } else {
        return h('div', {
          style: {
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            padding: '4px 12px',
            lineHeight: '32px'
          }
        }, [
          h(NText, {
            depth: row.defaultValue !== undefined && row.defaultValue !== null && row.defaultValue !== '' ? 1 : 3
          }, {
            default: () => formatDefaultValue(row.defaultValue, row.type)
          })
        ])
      }
    }
  },
  {
    title: '描述',
    key: 'description',
    width: 150,
    render: (row: DataField) => {
      const isEditing = editingFieldId.value === row.id
      
      if (isEditing) {
        return h('div', {
          style: {
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            padding: '4px 0'
          }
        }, [
          h(NInput, {
            value: editingData.value.description || row.description || '',
            placeholder: '字段描述（可选）',
            size: 'small',
            style: { width: '100%', height: '32px' },
            onUpdateValue: (value: string) => {
              editingData.value.description = value
            }
          })
        ])
      } else {
        return h('div', {
          style: {
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            padding: '4px 12px',
            lineHeight: '32px'
          }
        }, [
          h(NText, {
            depth: row.description ? 1 : 3
          }, {
            default: () => row.description || '无描述'
          })
        ])
      }
    }
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 120,
    render: (row: DataField) => {
      return h('div', {
        style: {
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          padding: '4px 12px',
          lineHeight: '32px'
        }
      }, [
        h(NText, {
          depth: 2,
          style: { fontSize: '12px' }
        }, {
          default: () => row.createdAt ? format(new Date(row.createdAt), 'yyyy-MM-dd HH:mm') : '-'
        })
      ])
    }
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    width: 120,
    render: (row: DataField) => {
      return h('div', {
        style: {
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          padding: '4px 12px',
          lineHeight: '32px'
        }
      }, [
        h(NText, {
          depth: 2,
          style: { fontSize: '12px' }
        }, {
          default: () => row.updatedAt ? format(new Date(row.updatedAt), 'yyyy-MM-dd HH:mm') : '-'
        })
      ])
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (row: DataField) => {
      const isEditing = editingFieldId.value === row.id
      
      return h('div', {
        class: 'field-actions',
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
          onClick: () => isEditing ? confirmEdit(row.id) : startEdit(row.id, row)
        }, {
          icon: () => h(NIcon, null, { 
            default: () => h(isEditing ? CheckmarkOutline : CreateOutline) 
          })
        }),
        // 删除按钮
        h(NButton, {
          size: 'small',
          quaternary: true,
          type: 'error',
          disabled: isEditing,
          onClick: () => deleteField(row.id)
        }, {
          icon: () => h(NIcon, null, { default: () => h(TrashOutline) })
        })
      ])
    }
  }
])

// 格式化默认值显示
function formatDefaultValue(value: any, type: FieldType): string {
  if (value === null || value === undefined || value === '') return '无默认值'
  
  switch (type) {
    case FieldTypeEnum.BOOLEAN:
      return value ? '是' : '否'
    case FieldTypeEnum.DATE:
      return value ? format(new Date(value), 'yyyy-MM-dd') : '无默认值'
    case FieldTypeEnum.NUMBER:
      return value.toString()
    default:
      return value.toString()
  }
}

function getFieldTypeLabel(type: FieldType): string {
  const option = fieldTypeOptions.find(opt => opt.value === type)
  return option?.label || '未知'
}

// 开始编辑
function startEdit(fieldId: string, field: DataField) {
  editingFieldId.value = fieldId
  editingData.value = { ...field }
}

// 确认编辑
function confirmEdit(fieldId: string) {
  try {
    if (!editingData.value.name?.trim()) {
      message.error('字段名称不能为空')
      return
    }
    
    const updates = { ...editingData.value }
    emit('update-field', { id: fieldId, updates })
    
    // 重置编辑状态
    editingFieldId.value = null
    editingData.value = {}
    
    message.success('字段更新成功')
  } catch (error) {
    message.error('字段更新失败')
  }
}

// 添加新字段
function addNewField() {
  showAddField.value = true
}

// 根据字段类型获取默认值输入组件
function getDefaultValueComponent(type: FieldType) {
  switch (type) {
    case FieldTypeEnum.NUMBER:
      return 'n-input-number'
    case FieldTypeEnum.BOOLEAN:
      return 'n-switch'
    case FieldTypeEnum.DATE:
      return 'n-date-picker'
    default:
      return 'n-input'
  }
}

// 获取默认值占位符
function getDefaultValuePlaceholder(type: FieldType): string {
  switch (type) {
    case FieldTypeEnum.NUMBER:
      return '请输入默认数字'
    case FieldTypeEnum.BOOLEAN:
      return ''
    case FieldTypeEnum.DATE:
      return '请选择默认日期'
    default:
      return '请输入默认值'
  }
}

// 处理类型变化，重置默认值
function handleTypeChange(type: FieldType) {
  switch (type) {
    case FieldTypeEnum.NUMBER:
      newField.defaultValue = 0
      break
    case FieldTypeEnum.BOOLEAN:
      newField.defaultValue = false
      break
    case FieldTypeEnum.DATE:
      newField.defaultValue = Date.now()
      break
    default:
      newField.defaultValue = ''
  }
}

function handleAddField() {
  formRef.value?.validate((errors: any) => {
    if (!errors) {
      emit('add-field', {
        name: newField.name,
        type: newField.type,
        required: newField.required,
        defaultValue: newField.defaultValue
      })
      
      // 重置表单
      newField.name = ''
      newField.type = FieldTypeEnum.STRING
      newField.required = false
      newField.defaultValue = ''
      newField.description = ''
      showAddField.value = false
      
      message.success('字段添加成功')
    }
  })
}

// 删除字段
function deleteField(fieldId: string) {
  emit('delete-field', fieldId)
  message.success('字段删除成功')
}
</script>

<style scoped>
.field-edit {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.field-toolbar {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.field-table {
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
:deep(.n-select) {
  height: 32px;
}

:deep(.n-input .n-input__input-el) {
  height: 30px;
  line-height: 30px;
}

/* 表单样式优化 */
:deep(.n-form-item) {
  margin-bottom: 16px;
}

:deep(.n-form-item-label) {
  padding-right: 12px;
}
</style>