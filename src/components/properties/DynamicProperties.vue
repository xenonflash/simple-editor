<template>
  <div class="dynamic-properties">
    <div v-for="(schema, key) in propsSchema" :key="key" class="property-row">
      <label>{{ schema.label }}</label>
      
      <input v-if="schema.type === 'text'"
             type="text"
             :value="modelValue[key]"
             @input="updateValue(key, ($event.target as HTMLInputElement).value)" />
             
      <input v-else-if="schema.type === 'number'"
             type="number"
             :value="modelValue[key]"
             @input="updateValue(key, Number(($event.target as HTMLInputElement).value))" />
             
      <select v-else-if="schema.type === 'select'"
              :value="modelValue[key]"
              @change="updateValue(key, ($event.target as HTMLSelectElement).value)">
        <option v-for="opt in schema.options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      
      <div v-else-if="schema.type === 'boolean'" class="checkbox-wrapper">
        <input type="checkbox"
               :checked="modelValue[key]"
               @change="updateValue(key, ($event.target as HTMLInputElement).checked)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropSchema } from '../../config/naive-ui-registry';

const props = defineProps<{
  modelValue: Record<string, any>;
  propsSchema: Record<string, PropSchema>;
}>();

const emit = defineEmits(['update:modelValue', 'change']);

function updateValue(key: string, value: any) {
  // const newValue = { ...props.modelValue, [key]: value };
  // emit('update:modelValue', newValue);
  emit('change', { [key]: value });
}
</script>

<style scoped>
.dynamic-properties {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}

.property-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.property-row label {
  width: 80px;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.property-row input[type="text"],
.property-row input[type="number"],
.property-row select {
  flex: 1;
  height: 28px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 0 8px;
  font-size: 12px;
  outline: none;
  min-width: 0;
}

.property-row input[type="text"]:focus,
.property-row input[type="number"]:focus,
.property-row select:focus {
  border-color: #1890ff;
}

.checkbox-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
}
</style>
