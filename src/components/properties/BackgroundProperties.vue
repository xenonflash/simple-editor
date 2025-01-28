<template>
  <div class="section">
    <div class="section-header">
      <span>背景</span>
    </div>
    <div class="section-content">
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
          <select :value="gradientType"
                  @change="updateValue('gradientType', $event)">
            <option value="none">无</option>
            <option value="linear">线性渐变</option>
            <option value="radial">径向渐变</option>
          </select>
        </div>
      </div>
      <div class="property-row" v-if="gradientType !== 'none'">
        <div class="property-item">
          <label>渐变颜色</label>
          <div class="gradient-colors">
            <div class="color-input">
              <input type="color" 
                     :value="gradientColor1" 
                     @input="updateValue('gradientColor1', $event)" />
              <input type="text"
                     :value="gradientColor1"
                     @input="updateValue('gradientColor1', $event)"
                     placeholder="#ffffff" />
            </div>
            <div class="color-input">
              <input type="color" 
                     :value="gradientColor2" 
                     @input="updateValue('gradientColor2', $event)" />
              <input type="text"
                     :value="gradientColor2"
                     @input="updateValue('gradientColor2', $event)"
                     placeholder="#000000" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

const props = defineProps<{
  backgroundImage?: string;
  backgroundColor?: string;
  gradientType?: string;
  gradientColor1?: string;
  gradientColor2?: string;
}>();

const emit = defineEmits(['update']);

const backgroundImage = ref(props.backgroundImage || '');
const backgroundColor = ref(props.backgroundColor || '#ffffff');
const gradientType = ref(props.gradientType || 'none');
const gradientColor1 = ref(props.gradientColor1 || '#ffffff');
const gradientColor2 = ref(props.gradientColor2 || '#000000');

function updateValue(key: string, event: Event) {
  const target = event.target as HTMLInputElement;
  let value = target.value;
  
  if (key.includes('Color') && value) {
    value = value.startsWith('#') ? value : `#${value.replace(/[^0-9a-fA-F]/g, '')}`;
  }
  
  emit('update', { [key]: value });
}

watch(props, (newProps) => {
  backgroundImage.value = newProps.backgroundImage || '';
  backgroundColor.value = newProps.backgroundColor || '#ffffff';
  gradientType.value = newProps.gradientType || 'none';
  gradientColor1.value = newProps.gradientColor1 || '#ffffff';
  gradientColor2.value = newProps.gradientColor2 || '#000000';
});
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
  align-items: flex-start;
  flex-direction: column;
}

.property-item label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.property-item input[type="text"],
.property-item select {
  width: 100%;
  height: 24px;
  padding: 0 4px;
  border: 1px solid #ddd;
  border-radius: 2px;
  font-size: 12px;
}

.color-input {
  display: flex;
  align-items: center;
  width: 100%;
}

.color-input input[type="color"] {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #ddd;
  border-radius: 2px;
  margin-right: 4px;
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
</style>
