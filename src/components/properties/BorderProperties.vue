# 边框属性组件
<template>
  <PropertySection title="边框">
    <template #content>
      <!-- 第一行：宽度和颜色 -->
      <div class="row-controls">
        <div class="width-group">
          <label class="control-label">宽度</label>
          <input type="number" 
                 :value="borderWidth" 
                 @input="updateValue('borderWidth', $event)"
                 min="0"
                 step="1"
                 class="width-input"
                 placeholder="0" />
        </div>
        <div class="color-group">
          <label class="control-label">颜色</label>
          <div class="color-controls">
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
      
      <!-- 第二行：类型选择 -->
      <div class="row-controls">
        <div class="style-group">
          <label class="control-label">类型</label>
          <div class="style-options">
            <label class="style-option" v-for="style in borderStyles" :key="style.value">
              <input type="radio" 
                     :value="style.value"
                     :checked="(borderStyle || 'none') === style.value"
                     @change="updateValue('borderStyle', $event)"
                     class="style-radio" />
              <div class="style-preview" :class="style.value">
                <div class="style-line" :style="getStylePreview(style.value)"></div>
              </div>
              <span class="style-name">{{ style.name }}</span>
            </label>
          </div>
        </div>
      </div>
    </template>
  </PropertySection>
</template>

<script setup lang="ts">
import PropertySection from './PropertySection.vue';

import { computed } from 'vue';

const props = defineProps<{
  borderWidth?: number;
  borderStyle?: string;
  borderColor?: string;
}>();

const emit = defineEmits(['update']);

// 边框样式选项
const borderStyles = [
  { value: 'none', name: '无' },
  { value: 'solid', name: '实线' },
  { value: 'dashed', name: '虚线' },
  { value: 'dotted', name: '点线' },
  { value: 'double', name: '双线' }
];

// 确保默认值
const defaultBorderWidth = computed(() => props.borderWidth ?? 0);
const defaultBorderStyle = computed(() => props.borderStyle ?? 'none');
const defaultBorderColor = computed(() => props.borderColor ?? '#000000');

// 获取样式预览
function getStylePreview(styleValue: string) {
  if (styleValue === 'none') {
    return { border: 'none' };
  }
  return {
    borderTop: `2px ${styleValue} #666`
  };
}

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
.row-controls {
  display: flex;
  gap: 4px; /* 统一间距 */
  margin-bottom: 4px; /* 统一间距 */
}
.width-group {
  flex: 1;
}
.width-group input {
  width: 20px
}
.color-group{
  flex: 2
}
[class*="-group"] .control-label{
  display: inline-block;
  margin-right: 5px;
}


.control-label {
  display: block;
  font-size: 11px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.color-controls {
  display: flex;
  gap: 4px;
  align-items: center;
}

.style-group {
  width: 100%;
}

.style-options {
  display: flex;
  gap: 4px; /* 统一间距 */
  flex-wrap: wrap;
}

.style-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  font-size: 10px;
  color: #666;
  padding: 4px;
  border-radius: 2px; /* 统一圆角 */
  transition: background-color 0.2s;
}

.style-option:hover {
  background-color: #f5f5f5;
}

.style-option input[type="radio"] {
  display: none;
}

.style-preview {
  width: 24px;
  height: 16px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  transition: border-color 0.2s;
}

.style-option input[type="radio"]:checked + .style-preview {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.style-line {
  width: 16px;
  height: 2px;
  background: #333;
}

.style-name {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

input[type="number"],
input[type="text"],
input[type="color"] {
  height: 24px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  font-size: 11px;
  font-family: inherit;
  background: white;
  outline: none;
}

input[type="number"],
input[type="text"] {
  padding: 0 6px;
  width: 50px
}

input[type="color"] {
  width: 24px;
  padding: 0;
  cursor: pointer;
}

input[type="number"]:hover,
input[type="text"]:hover,
input[type="color"]:hover {
  border-color: #d9d9d9;
}

input[type="number"]:focus,
input[type="text"]:focus,
input[type="color"]:focus {
  border-color: #000;
}

::-webkit-inner-spin-button {
  display: none;
}
</style>
