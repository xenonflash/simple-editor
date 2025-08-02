<template>
  <PropertySection title="阴影">
    <template #content>
      <!-- 四个方向的数值设置 -->
      <div class="values-grid">
        <div class="value-item">
          <label>水平</label>
          <input type="number" 
                 :value="shadowX" 
                 @input="updateValue('shadowX', $event)" />
        </div>
        <div class="value-item">
          <label>垂直</label>
          <input type="number" 
                 :value="shadowY" 
                 @input="updateValue('shadowY', $event)" />
        </div>
        <div class="value-item">
          <label>模糊</label>
          <input type="number" 
                 min="0"
                 :value="shadowBlur" 
                 @input="updateValue('shadowBlur', $event)" />
        </div>
        <div class="value-item">
          <label>扩散</label>
          <input type="number" 
                 :value="shadowSpread" 
                 @input="updateValue('shadowSpread', $event)" />
        </div>
      </div>
      
      <!-- 阴影颜色、内阴影和预览 -->
      <div class="bottom-section">
        <div class="controls-column">
          <div class="color-item">
            <label>阴影颜色</label>
            <input type="color" 
                   :value="shadowColor" 
                   @input="updateValue('shadowColor', $event)" />
          </div>
          <div class="checkbox-item">
            <label>
              <input type="checkbox"
                     :checked="shadowInset"
                     @change="updateValue('shadowInset', $event)" />
              内阴影
            </label>
          </div>
        </div>
        <div class="preview-column">
          <label>预览</label>
          <div class="shadow-preview" :style="{ boxShadow: computedShadow }"></div>
        </div>
      </div>
    </template>
  </PropertySection>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PropertySection from './PropertySection.vue';

interface Props {
  shadowX?: number
  shadowY?: number
  shadowBlur?: number
  shadowSpread?: number
  shadowColor?: string
  shadowInset?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  shadowX: 0,
  shadowY: 0,
  shadowBlur: 0,
  shadowSpread: 0,
  shadowColor: '#000000',
  shadowInset: false
})

const emit = defineEmits<{
  (e: 'update', updates: Record<string, any>): void
}>()

// 计算阴影样式
const computedShadow = computed(() => {
  const inset = props.shadowInset ? 'inset ' : '';
  return `${inset}${props.shadowX}px ${props.shadowY}px ${props.shadowBlur}px ${props.shadowSpread}px ${props.shadowColor}`;
})

const updateValue = (key: string, event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.type === 'checkbox' 
    ? target.checked 
    : target.type === 'number' 
      ? Number(target.value) 
      : target.value
  emit('update', { [key]: value })
}
</script>

<style scoped>
/* 移除原有的 .section, .section-header, .section-content 样式 */

.values-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.value-item {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 24px;
}

.value-item label {
  width: 28px; /* 调整标签宽度，与其他组件保持一致 */
  font-size: 11px;
  color: #333;
  font-weight: 500;
  flex-shrink: 0; /* 防止标签被压缩 */
}

.value-item input[type="number"] {
  flex: 1; /* 使用 flex: 1 而不是 width: 100% */
  height: 24px;
  width: 30px;
  padding: 0 6px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  font-size: 11px;
  font-family: inherit;
  background: white;
  outline: none;
  min-width: 0; /* 允许输入框收缩 */
}

.bottom-section {
  display: flex;
  gap: 8px;
}

.controls-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px; /* 增加垂直间距 */
}

.preview-column {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.color-item {
  display: flex;
  flex-direction: column;
}

.color-item label {
  font-size: 11px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.color-item input[type="color"] {
  width: 100%;
  height: 24px;
  padding: 0;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  cursor: pointer;
  outline: none;
}

.checkbox-item {
  display: flex;
  align-items: center;
}

.checkbox-item label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #333;
  cursor: pointer;
  margin: 0;
}

.checkbox-item input[type="checkbox"] {
  width: auto;
  height: auto;
  margin: 0;
}

.preview-column label {
  font-size: 11px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}

.shadow-preview {
  width: 100%;
  height: 40px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  flex: 1;
}

/* 输入框通用样式 */
input[type="number"]:hover,
input[type="color"]:hover {
  border-color: #d9d9d9;
}

input[type="number"]:focus,
input[type="color"]:focus {
  border-color: #000;
}

/* 隐藏数字输入框的上下箭头 */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
