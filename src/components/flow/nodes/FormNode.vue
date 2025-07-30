<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { ref, watch } from 'vue'

interface Props {
  id: string
  data: {
    label: string
    fields: Array<{
      name: string
      type: string
      value: any
      options?: string[]
    }>
  }
  selected?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  updateData: [id: string, data: any]
}>()

const formData = ref<Record<string, any>>({})

// 初始化表单数据
watch(() => props.data.fields, (fields) => {
  fields.forEach(field => {
    if (formData.value[field.name] === undefined) {
      formData.value[field.name] = field.value
    }
  })
}, { immediate: true })

const updateField = (fieldName: string, value: any) => {
  formData.value[fieldName] = value
  emit('updateData', props.id, { 
    ...props.data, 
    formData: { ...formData.value }
  })
}
</script>

<template>
  <div class="form-node" :class="{ selected }">
    <Handle type="target" :position="Position.Top" />
    
    <div class="form-header">
      <h4>{{ data.label }}</h4>
    </div>
    
    <div class="form-body">
      <div v-for="field in data.fields" :key="field.name" class="form-field">
        <label>{{ field.name }}</label>
        <input 
          v-if="field.type === 'text'"
          type="text"
          :value="formData[field.name] || field.value"
          @input="updateField(field.name, ($event.target as HTMLInputElement).value)"
        />
        <input 
          v-else-if="field.type === 'number'"
          type="number"
          :value="formData[field.name] || field.value"
          @input="updateField(field.name, Number(($event.target as HTMLInputElement).value))"
        />
        <select 
          v-else-if="field.type === 'select'"
          :value="formData[field.name] || field.value"
          @change="updateField(field.name, ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="option in field.options" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        <textarea
          v-else-if="field.type === 'textarea'"
          :value="formData[field.name] || field.value"
          @input="updateField(field.name, ($event.target as HTMLTextAreaElement).value)"
          rows="3"
        ></textarea>
      </div>
    </div>
    
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.form-node {
  background: white;
  border: 2px solid #d9d9d9;
  border-radius: 8px;
  min-width: 220px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.form-node.selected {
  border-color: #1890ff;
  box-shadow: 0 4px 16px rgba(24, 144, 255, 0.3);
}

.form-header {
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e8e8e8;
}

.form-header h4 {
  margin: 0;
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.form-body {
  padding: 16px;
}

.form-field {
  margin-bottom: 12px;
}

.form-field:last-child {
  margin-bottom: 0;
}

.form-field label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  transition: border-color 0.2s;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  outline: none;
  border-color: #1890ff;
}

.form-field textarea {
  resize: vertical;
  min-height: 60px;
}
</style>