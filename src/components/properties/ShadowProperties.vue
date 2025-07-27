# 阴影属性组件
<template>
  <div class="section">
    <div class="section-header">
      <span>阴影</span>
    </div>
    <div class="section-content">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

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
  
  emit('update', { 
    [key]: value,
    boxShadow: computedShadow.value // 同时发送计算后的 box-shadow 值
  })
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
  padding: 12px;
}

/* 四个方向数值的网格布局 */
.values-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.value-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value-item label {
  font-size: 11px;
  color: #666;
  flex-shrink: 0;
}

.value-item input[type="number"] {
  flex: 1;
  height: 24px;
  padding: 0 4px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 12px;
  width: 30px;
}

/* 底部区域：颜色控制和预览 */
.bottom-section {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.controls-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 50px;
}

.color-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.color-item label {
  font-size: 11px;
  color: #666;
}

.color-item input[type="color"] {
  width: 100%;
  height: 32px;
  padding: 0;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  cursor: pointer;
}

.checkbox-item {
  display: flex;
  align-items: center;
}

.checkbox-item label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 11px;
  color: #666;
}

.checkbox-item input[type="checkbox"] {
  width: 14px;
  height: 14px;
  margin: 0;
}

.preview-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-column label {
  font-size: 11px;
  color: #666;
}

.shadow-preview {
  width: 100%;
  height: 50px;
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  min-width: 8px;
}
</style>
