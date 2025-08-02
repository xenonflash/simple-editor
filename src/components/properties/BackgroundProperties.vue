<template>
  <PropertySection title="背景">
    <template #content>
      <div class="property-row">
        <div class="property-item">
          <label>背景图片</label>
          <input type="text" 
                 :value="backgroundImage" 
                 @input="updateValue('backgroundImage', $event)" 
                 placeholder="输入图片 URL" />
        </div>
      </div>
      <div class="property-row">
        <div class="property-item">
          <label>背景颜色</label>
          <div class="color-input">
            <input type="color" 
                   :value="backgroundColor" 
                   @input="updateValue('backgroundColor', $event)" />
            <input type="text"
                   :value="backgroundColor"
                   @input="updateValue('backgroundColor', $event)"
                   placeholder="#ffffff" />
          </div>
        </div>
      </div>
      <div class="property-row">
        <div class="property-item">
          <label>渐变类型</label>
          <div class="radio-group">
            <label class="radio-item">
              <input type="radio" 
                     :checked="gradientType === 'none'"
                     @change="() => updateValue('gradientType', 'none')" />
              <span>无</span>
            </label>
            <label class="radio-item">
              <input type="radio" 
                     :checked="gradientType === 'linear'"
                     @change="() => updateValue('gradientType', 'linear')" />
              <span>线性</span>
            </label>
            <label class="radio-item">
              <input type="radio" 
                     :checked="gradientType === 'radial'"
                     @change="() => updateValue('gradientType', 'radial')" />
              <span>径向</span>
            </label>
          </div>
        </div>
      </div>
      <div class="property-row" v-if="gradientType === 'linear'">
        <div class="property-item">
          <label>渐变方向</label>
          <div class="direction-group">
            <button v-for="dir in directions" 
                    :key="dir.value"
                    :class="['direction-btn', { active: (gradientDirection || '135deg') === dir.value }]"
                    @click="() => updateValue('gradientDirection', dir.value)">
              {{ dir.icon }}
            </button>
          </div>
        </div>
      </div>
      <div class="property-row" v-if="gradientType !== 'none'">
        <div class="property-item">
          <label>渐变预览</label>
          <div class="gradient-preview-container">
            <input type="color" 
                   class="color-picker start-color"
                   :value="gradientColor1" 
                   @input="updateValue('gradientColor1', $event)" 
                   title="起始颜色" />
            <div class="gradient-preview" :style="previewStyle"></div>
            <input type="color" 
                   class="color-picker end-color"
                   :value="gradientColor2" 
                   @input="updateValue('gradientColor2', $event)" 
                   title="结束颜色" />
          </div>
        </div>
      </div>
    </template>
  </PropertySection>
</template>

<script setup lang="ts">
import PropertySection from './PropertySection.vue';

import { ref, watch, computed } from 'vue';

const props = defineProps<{
  backgroundImage?: string;
  backgroundColor?: string;
  gradientType?: string;
  gradientColor1?: string;
  gradientColor2?: string;
  gradientDirection?: string;
}>();

const emit = defineEmits(['update']);

const backgroundImage = ref(props.backgroundImage || '');
const backgroundColor = ref(props.backgroundColor || '#ffffff');
const gradientType = ref(props.gradientType || 'none');
const gradientColor1 = ref(props.gradientColor1 || '#ffffff');
const gradientColor2 = ref(props.gradientColor2 || '#000000');
const gradientDirection = ref(props.gradientDirection || '135deg');

// 渐变方向选项
const directions = [
  { value: '0deg', icon: '↑' },
  { value: '45deg', icon: '↗' },
  { value: '90deg', icon: '→' },
  { value: '135deg', icon: '↘' },
  { value: '180deg', icon: '↓' },
  { value: '225deg', icon: '↙' },
  { value: '270deg', icon: '←' },
  { value: '315deg', icon: '↖' }
];

// 渐变预览样式
const previewStyle = computed(() => {
  if (gradientType.value === 'none') {
    return {
      background: '#f5f5f5'
    };
  }
  
  if (gradientType.value === 'linear') {
    const gradient = `linear-gradient(${gradientDirection.value}, ${gradientColor1.value}, ${gradientColor2.value})`;
    console.log('Linear gradient:', gradient);
    return {
      background: gradient
    };
  } else if (gradientType.value === 'radial') {
    const gradient = `radial-gradient(circle, ${gradientColor1.value}, ${gradientColor2.value})`;
    console.log('Radial gradient:', gradient);
    return {
      background: gradient
    };
  }
  
  return {
    background: '#f5f5f5'
  };
});

function updateValue(key: string, eventOrValue: Event | string) {
  let value: string;
  
  if (typeof eventOrValue === 'string') {
    value = eventOrValue;
  } else {
    const target = eventOrValue.target as HTMLInputElement;
    value = target.value;
  }
  
  if (key.includes('Color') && value) {
    value = value.startsWith('#') ? value : `#${value.replace(/[^0-9a-fA-F]/g, '')}`;
  }
  
  // 同步更新本地状态
  if (key === 'gradientType') {
    gradientType.value = value;
  } else if (key === 'gradientColor1') {
    gradientColor1.value = value;
  } else if (key === 'gradientColor2') {
    gradientColor2.value = value;
  } else if (key === 'gradientDirection') {
    gradientDirection.value = value;
  } else if (key === 'backgroundColor') {
    backgroundColor.value = value;
  } else if (key === 'backgroundImage') {
    backgroundImage.value = value;
  }
  
  emit('update', { [key]: value });
}

watch(props, (newProps) => {
  backgroundImage.value = newProps.backgroundImage || '';
  backgroundColor.value = newProps.backgroundColor || '#ffffff';
  gradientType.value = newProps.gradientType || 'none';
  gradientColor1.value = newProps.gradientColor1 || '#ffffff';
  gradientColor2.value = newProps.gradientColor2 || '#000000';
  gradientDirection.value = newProps.gradientDirection || '135deg';
});
</script>

<style scoped>
.property-row {
  margin-bottom: 4px; /* 统一间距 */
}

.property-row:last-child {
  margin-bottom: 0;
}

.property-item {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
}

.property-item label {
  font-size: 11px; /* 统一字体 */
  color: #333; /* 统一颜色 */
  font-weight: 500;
  margin-bottom: 4px;
}

.property-item input[type="text"],
.property-item select {
  width: 100%;
  height: 24px;
  padding: 0 6px;
  border: 1px solid #e5e5e5; /* 统一边框 */
  border-radius: 2px;
  font-size: 11px;
}

.color-input {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 4px; /* 统一间距 */
}

.color-input input[type="color"] {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #e5e5e5; /* 统一边框 */
  border-radius: 2px;
}

.color-input input[type="text"] {
  flex: 1;
}

.gradient-colors {
  width: 100%;
}

.gradient-colors .color-input {
  margin-bottom: 4px;
}

.gradient-colors .color-input:last-child {
  margin-bottom: 0;
}

.radio-group {
  display: flex;
  gap: 4px; /* 统一间距 */
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 11px;
}

.radio-item input[type="radio"] {
  width: 12px;
  height: 12px;
  margin: 0;
}

.direction-group {
  display: flex;
  gap: 4px;
}

.direction-btn {
  width: 22px;
  height: 22px;
  border: 1px solid #e5e5e5; /* 统一边框 */
  border-radius: 2px; /* 统一圆角 */
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}

.direction-btn:hover {
  border-color: #d9d9d9; /* 统一hover */
  background: #f0f8ff;
}

.direction-btn.active {
  border-color: #1890ff;
  background: #1890ff;
  color: white;
}

.gradient-preview-container {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.gradient-preview {
  flex: 1;
  height: 32px;
  border: 1px solid #e5e5e5; /* 统一边框 */
  border-radius: 2px; /* 统一圆角 */
  background: #f5f5f5;
  min-width: 100px;
}

.color-picker {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e5e5; /* 统一边框 */
  border-radius: 2px; /* 统一圆角 */
  cursor: pointer;
  padding: 0;
}

/* 统一输入框样式 */
input[type="text"]:hover,
input[type="color"]:hover {
  border-color: #d9d9d9;
}

input[type="text"]:focus,
input[type="color"]:focus {
  border-color: #000;
}

input[type="radio"] {
  width: auto;
  height: auto;
  margin: 0;
}
</style>
