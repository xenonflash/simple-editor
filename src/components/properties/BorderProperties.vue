# 边框属性组件
<template>
  <div class="section">
    <div class="section-header">
      <span>边框</span>
    </div>
    <div class="section-content">
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
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 行布局 */
.row-controls {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

/* 通用标签样式 */
.control-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
  display: block;
  font-weight: 500;
}

/* 宽度组 */
.width-group {
  display: flex;
  flex-direction: column;
  min-width: 60px;
}

.width-input {
  width: 50px;
  height: 24px;
  padding: 0 6px;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  font-size: 12px;
  text-align: center;
  transition: all 0.2s;
}

/* 颜色组 */
.color-group {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.color-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-picker {
  width: 24px;
  height: 24px;
  padding: 1px;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  cursor: pointer;
  background: white;
  transition: all 0.2s;
}

.color-input {
  flex: 1;
  height: 24px;
  padding: 0 6px;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  font-size: 11px;
  font-family: monospace;
  transition: all 0.2s;
  min-width: 60px;
}

/* 样式组 */
.style-group {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.style-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.style-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  padding: 3px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  background: white;
  transition: all 0.2s;
  min-width: 20px;
}

.style-option:hover {
  border-color: #40a9ff;
  background: #f8fcff;
}

.style-option:has(.style-radio:checked) {
  border-color: #1890ff;
  background: #e6f7ff;
}

.style-radio {
  display: none;
}

.style-preview {
  width: 24px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 2px;
}

.style-line {
  width: 20px;
  height: 2px;
}

.style-name {
  font-size: 10px;
  color: #666;
  text-align: center;
  line-height: 1;
}

/* Hover 和 Focus 状态 */
.width-input:hover,
.color-picker:hover,
.color-input:hover {
  border-color: #40a9ff;
}

.width-input:focus,
.color-picker:focus,
.color-input:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

/* 禁用数字输入框的上下箭头 */
.width-input::-webkit-inner-spin-button,
.width-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.width-input[type="number"] {
  -moz-appearance: textfield;
}

/* 优化 placeholder 样式 */
.width-input::placeholder,
.color-input::placeholder {
  color: #bfbfbf;
  font-size: 11px;
}

/* 响应式调整 */
@media (max-width: 280px) {
  .row-controls {
    flex-direction: column;
    gap: 8px;
  }
  
  .style-options {
    justify-content: center;
  }
}
</style>
