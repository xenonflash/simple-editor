# 边框属性组件
<template>
  <div class="section">
    <div class="section-header">
      <span>边框</span>
    </div>
    <div class="section-content">
      <div class="property-row">
        <div class="property-item">
          <label>粗细</label>
          <input type="number" 
                 :value="borderWidth" 
                 @input="updateValue('borderWidth', $event)"
                 min="0"
                 step="1" />
        </div>
      </div>
      <div class="property-row">
        <div class="property-item">
          <label>样式</label>
          <select :value="borderStyle || 'none'"
                  @change="updateValue('borderStyle', $event)">
            <option value="none">无</option>
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="dotted">点线</option>
            <option value="double">双线</option>
          </select>
        </div>
      </div>
      <div class="property-row">
        <div class="property-item">
          <label>颜色</label>
          <div class="color-input">
            <input type="color" 
                   :value="borderColor || '#000000'"
                   @input="updateValue('borderColor', $event)" />
            <input type="text"
                   :value="borderColor || '#000000'"
                   @input="updateValue('borderColor', $event)"
                   placeholder="#000000" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  borderWidth?: number;
  borderStyle?: string;
  borderColor?: string;
}>();

const emit = defineEmits(['update']);

// 确保默认值
const defaultBorderWidth = computed(() => props.borderWidth ?? 0);
const defaultBorderStyle = computed(() => props.borderStyle ?? 'none');
const defaultBorderColor = computed(() => props.borderColor ?? '#000000');

function updateValue(key: string, event: Event) {
  const target = event.target as HTMLInputElement;
  let value: string | number = target.value;
  
  if (key === 'borderWidth') {
    value = Number(value) || 0;
  } else if (key === 'borderStyle' && !value) {
    value = 'none';
  } else if (key === 'borderColor') {
    value = value.startsWith('#') ? value : `#${value.replace(/[^0-9a-fA-F]/g, '')}`;
  }
  
  // 发送更新事件
  emit('update', { [key]: value });
}
</script>

<style scoped>
.section {
  border-bottom: 1px solid #e5e5e5;
}

.section-header {
  height: 32px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fafafa;
}

.section-header span {
  font-size: 11px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-content {
  padding: 8px;
}

.property-row {
  margin-bottom: 8px;
}

.property-row:last-child {
  margin-bottom: 0;
}

.property-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.property-item label {
  width: 32px;
  font-size: 11px;
  color: #333;
}

input[type="number"],
input[type="text"],
select {
  flex: 1;
  height: 24px;
  padding: 0 6px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  font-size: 11px;
  font-family: inherit;
  background: white;
  outline: none;
}

.color-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

input[type="color"] {
  width: 24px;
  height: 24px;
  padding: 2px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  cursor: pointer;
  background: white;
}

input[type="color"]:hover,
input[type="number"]:hover,
input[type="text"]:hover,
select:hover {
  border-color: #d9d9d9;
}

input[type="color"]:focus,
input[type="number"]:focus,
input[type="text"]:focus,
select:focus {
  border-color: #000;
}

::-webkit-inner-spin-button {
  display: none;
}
</style>
