# 圆角属性组件
<template>
  <div class="section">
    <div class="section-header">
      <span>圆角</span>
      <div class="radius-controls">
        <div class="slider-control">
          <input type="range"
                 class="radius-slider"
                 :value="commonRadius"
                 @input="updateAllRadius($event)"
                 min="0"
                 max="100"
                 step="1" />
          <input type="number"
                 class="all-radius-input"
                 :value="commonRadius"
                 @input="updateAllRadius($event)"
                 min="0"
                 placeholder="0" />
        </div>
        <button class="link-button" 
                :class="{ active: isLinked }"
                @click="toggleLink">
          <span class="link-icon">⭷</span>
        </button>
      </div>
    </div>
    <div class="section-content">
      <div class="radius-grid">
        <div class="radius-item top-left">
          <input type="number"
                 :value="borderRadiusTopLeft"
                 @input="updateRadius('borderRadiusTopLeft', $event)"
                 :disabled="isLinked"
                 min="0"
                 placeholder="0" />
        </div>
        <div class="radius-item top-right">
          <input type="number"
                 :value="borderRadiusTopRight"
                 @input="updateRadius('borderRadiusTopRight', $event)"
                 :disabled="isLinked"
                 min="0"
                 placeholder="0" />
        </div>
        <div class="radius-preview">
          <div class="preview-box" :style="previewStyle"></div>
        </div>
        <div class="radius-item bottom-left">
          <input type="number"
                 :value="borderRadiusBottomLeft"
                 @input="updateRadius('borderRadiusBottomLeft', $event)"
                 :disabled="isLinked"
                 min="0"
                 placeholder="0" />
        </div>
        <div class="radius-item bottom-right">
          <input type="number"
                 :value="borderRadiusBottomRight"
                 @input="updateRadius('borderRadiusBottomRight', $event)"
                 :disabled="isLinked"
                 min="0"
                 placeholder="0" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Props {
  borderRadiusTopLeft?: number
  borderRadiusTopRight?: number
  borderRadiusBottomLeft?: number
  borderRadiusBottomRight?: number
}

const props = withDefaults(defineProps<Props>(), {
  borderRadiusTopLeft: 0,
  borderRadiusTopRight: 0,
  borderRadiusBottomLeft: 0,
  borderRadiusBottomRight: 0
})

const emit = defineEmits<{
  (e: 'update', updates: Record<string, any>): void
}>()

const isLinked = ref(false);

// 计算通用圆角值
const commonRadius = computed(() => {
  if (isLinked.value) {
    return props.borderRadiusTopLeft;
  }
  const values = [
    props.borderRadiusTopLeft,
    props.borderRadiusTopRight,
    props.borderRadiusBottomLeft,
    props.borderRadiusBottomRight
  ];
  return values.every(v => v === values[0]) ? values[0] : '';
});

// 预览样式
const previewStyle = computed(() => ({
  borderTopLeftRadius: `${props.borderRadiusTopLeft}px`,
  borderTopRightRadius: `${props.borderRadiusTopRight}px`,
  borderBottomLeftRadius: `${props.borderRadiusBottomLeft}px`,
  borderBottomRightRadius: `${props.borderRadiusBottomRight}px`
}))

// 更新所有圆角
function updateAllRadius(event: Event) {
  const value = Number((event.target as HTMLInputElement).value) || 0;
  emit('update', {
    borderRadiusTopLeft: value,
    borderRadiusTopRight: value,
    borderRadiusBottomLeft: value,
    borderRadiusBottomRight: value
  });
}

// 更新单个圆角值
function updateRadius(key: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value) || 0;
  if (!isLinked.value) {
    emit('update', { [key]: value });
  }
}

// 切换链接状态
function toggleLink() {
  isLinked.value = !isLinked.value;
  if (isLinked.value) {
    const firstNonZero = [
      props.borderRadiusTopLeft,
      props.borderRadiusTopRight,
      props.borderRadiusBottomLeft,
      props.borderRadiusBottomRight
    ].find(v => v > 0) || props.borderRadiusTopLeft;

    emit('update', {
      borderRadiusTopLeft: firstNonZero,
      borderRadiusTopRight: firstNonZero,
      borderRadiusBottomLeft: firstNonZero,
      borderRadiusBottomRight: firstNonZero
    });
  }
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

.radius-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.slider-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.radius-slider {
  width: 80px;
  height: 2px;
  -webkit-appearance: none;
  background: #e5e5e5;
  outline: none;
  border-radius: 1px;
}

.radius-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #d9d9d9;
  cursor: pointer;
  transition: all 0.2s;
}

.radius-slider::-webkit-slider-thumb:hover {
  border-color: #40a9ff;
  transform: scale(1.1);
}

.radius-slider::-webkit-slider-thumb:active {
  border-color: #1890ff;
  background: #e6f7ff;
}

.all-radius-input {
  width: 40px;
  height: 20px;
  padding: 0 4px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 11px;
  text-align: center;
}

.radius-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  position: relative;
  padding: 8px 24px;
}

.radius-preview {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  padding: 4px;
}

.preview-box {
  width: 100%;
  height: 100%;
  border: 1px solid #1890ff;
  background: rgba(24, 144, 255, 0.1);
}

.radius-item {
  position: relative;
  display: flex;
  align-items: center;
}

.radius-item input {
  width: 32px;
  height: 20px;
  padding: 0 4px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 11px;
  text-align: center;
}

.radius-item.top-left { justify-self: start; }
.radius-item.top-right { justify-self: end; }
.radius-item.bottom-left { justify-self: start; }
.radius-item.bottom-right { justify-self: end; }

.radius-item input:hover {
  border-color: #40a9ff;
}

.radius-item input:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.radius-item input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.link-button {
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.link-button.active {
  color: #1890ff;
}

.link-icon {
  font-size: 14px;
  transform: rotate(45deg);
}

::-webkit-inner-spin-button {
  display: none;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style> 