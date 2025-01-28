# 边框属性组件
<template>
  <div class="section">
    <div class="section-header">
      <span>边框</span>
    </div>
    <div class="section-content">
      <div class="border-controls">
        <!-- 边框宽度 -->
        <div class="control-item">
          <input type="number" 
                 :value="borderWidth" 
                 @input="updateValue('borderWidth', $event)"
                 min="0"
                 step="1"
                 class="width-input"
                 placeholder="0" />
        </div>

        <!-- 边框样式 -->
        <div class="control-item">
          <select :value="borderStyle || 'none'"
                  @change="updateValue('borderStyle', $event)"
                  class="style-select">
            <option value="none">无</option>
            <option value="solid">实线</option>
            <option value="dashed">虚线</option>
            <option value="dotted">点线</option>
            <option value="double">双线</option>
          </select>
        </div>

        <!-- 边框颜色 -->
        <div class="control-item color-control">
          <input type="color" 
                 :value="borderColor || '#000000'"
                 @input="updateValue('borderColor', $event)"
                 class="color-picker" />
          <input type="text"
                 :value="borderColor || '#000000'"
                 @input="updateValue('borderColor', $event)"
                 placeholder="#000000"
                 class="color-input" />
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
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.section-content {
  padding: 8px;
}

.border-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-item {
  display: flex;
  align-items: center;
}

.width-input {
  width: 36px;
  height: 20px;
  padding: 0 4px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 11px;
  text-align: center;
  transition: all 0.2s;
}

.style-select {
  height: 20px;
  padding: 0 4px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 11px;
  background: white;
  min-width: 52px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-control {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.color-picker {
  width: 20px;
  height: 20px;
  padding: 1px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  cursor: pointer;
  background: white;
  transition: all 0.2s;
}

.color-input {
  width: 58px;
  height: 20px;
  padding: 0 4px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 11px;
  font-family: monospace;
  transition: all 0.2s;
}

/* Hover 状态 */
.width-input:hover,
.style-select:hover,
.color-picker:hover,
.color-input:hover {
  border-color: #40a9ff;
}

/* Focus 状态 */
.width-input:focus,
.style-select:focus,
.color-picker:focus,
.color-input:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

/* 禁用数字输入框的上下箭头 */
::-webkit-inner-spin-button {
  display: none;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* 自定义 select 箭头 */
.style-select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 4px center;
  background-size: 12px;
  padding-right: 20px;
}

/* 优化 placeholder 样式 */
::placeholder {
  color: #bfbfbf;
}
</style>
