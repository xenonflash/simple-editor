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
    <div class="pill">表单</div>
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
    
    <Handle class="handle handle-in" type="target" :position="Position.Top" />
    <Handle class="handle handle-out" type="source" :position="Position.Bottom" />
  </div>
</template>

<style scoped>
.form-node {
  position: relative;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  min-width: 240px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  padding: 12px 16px 16px;
}

.form-node.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.18), 0 10px 20px rgba(0, 0, 0, 0.08);
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fff7e6;
  color: #d46b08;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 8px;
}

.form-header {
  padding: 10px 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
}

.form-header h4 {
  margin: 0;
  font-size: 13px;
  color: #1f1f1f;
  font-weight: 700;
}

.form-body {
  padding: 12px 2px 0;
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
  font-weight: 600;
}

.form-field input,
.form-field select,
.form-field textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #fff;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.12);
}

.form-field textarea {
  resize: vertical;
  min-height: 60px;
}

.handle {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.handle-in {
  top: 4px;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #8c8c8c;
}

.handle-out {
  bottom: 4px;
  left: 50%;
  transform: translate(-50%, 50%);
  background: #d46b08;
}
</style>