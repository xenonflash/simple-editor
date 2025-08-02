# 文字属性组件
<template>
  <PropertySection title="文字">
    <template #content>
      <!-- 文字内容 -->
      <div class="property-row">
        <textarea type="text" 
               :value="content" 
               @input="updateValue('content', $event)" 
               placeholder="输入文字内容..." />
      </div>
      
      <!-- 自动宽度开关 -->
      <div class="property-row">
        <label class="checkbox-label">
          <input type="checkbox" 
                 :checked="(widthMode || 'auto') === 'auto'" 
                 @change="emit('update', { widthMode: ($event.target as HTMLInputElement).checked ? 'auto' : 'fixed' })" />
          <span>自动宽度</span>
        </label>

        <label class="checkbox-label">
          <input type="checkbox" 
                 :checked="autoHeight !== false" 
                 @change="emit('update', { autoHeight: ($event.target as HTMLInputElement).checked })" />
          <span>自动高度</span>
        </label>
      </div>
      <!-- 字体设置 -->
      <div class="property-row controls">
        <select :value="fontFamily" 
                @change="updateValue('fontFamily', $event)">
          <option value="Arial">Arial</option>
          <option value="PingFang SC">PingFang SC</option>
          <option value="Microsoft YaHei">微软雅黑</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
        </select>
        <input type="number" 
               :value="fontSize" 
               @input="updateValue('fontSize', $event)"
               min="8"
               max="72" />
      </div>
      
      <!-- 文字样式按钮 -->
      <div class="property-row buttons">
        <button :class="{ active: fontWeight === 'bold' }"
                @click="toggleStyle('fontWeight', 'bold', 'normal')"
                title="粗体">
          B
        </button>
        <button :class="{ active: fontStyle === 'italic' }"
                @click="toggleStyle('fontStyle', 'italic', 'normal')"
                title="斜体">
          I
        </button>
        <button :class="{ active: textDecoration?.includes('underline') }"
                @click="toggleDecoration('underline')"
                title="下划线">
          U
        </button>
        <button :class="{ active: textDecoration?.includes('line-through') }"
                @click="toggleDecoration('line-through')"
                title="删除线">
          S
        </button>
        <input type="color" 
               :value="color" 
               @input="updateValue('color', $event)"
               title="文字颜色" />
      </div>
    </template>
  </PropertySection>
</template>

<script setup lang="ts">
import PropertySection from './PropertySection.vue';

const props = defineProps<{
  content: string;
  color?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  textDecoration?: string;
  fontStyle?: string;
  width?: number;
  height?: number;
  widthMode?: 'auto' | 'fixed';
  autoHeight?: boolean;
}>();

const emit = defineEmits(['update']);

function updateValue(key: string, event: Event) {
  const target = event.target as HTMLInputElement;
  let value: any;
  
  if (target.type === 'number') {
    value = Number(target.value);
  } else if (target.type === 'checkbox') {
    value = target.checked;
  } else {
    value = target.value;
  }
  
  emit('update', { [key]: value });
}

function toggleStyle(key: keyof typeof props, value: string, defaultValue: string) {
  const currentValue = props[key];
  const newValue = currentValue === value ? defaultValue : value;
  emit('update', { [key]: newValue });
}

function toggleDecoration(value: string) {
  const current = props.textDecoration || 'none';
  let newValue = 'none';
  
  if (current === 'none') {
    newValue = value;
  } else if (current === value) {
    newValue = 'none';
  } else if (current.includes(value)) {
    newValue = current.replace(value, '').trim();
    if (!newValue) newValue = 'none';
  } else {
    newValue = `${current} ${value}`.trim();
  }
  
  emit('update', { textDecoration: newValue });
}
</script>

<style scoped>
.property-row {
  margin-bottom: 4px; /* 统一间距 */
}

.property-row:last-child {
  margin-bottom: 0;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 4px; /* 统一间距 */
  cursor: pointer;
  font-size: 11px;
  color: #333;
  margin: 0 4px; /* 统一间距 */
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  height: auto;
  margin: 0;
}

textarea {
  max-width: 100%;
  min-width: 100%;
  max-height: 100px;
  min-height: fit-content;
  font-size: 12px;
  border-color: #ccc;
}
textarea:focus-visible{
  outline: none
}

input[type="text"],
input[type="number"],
select {
  width: 80px;
  height: 24px;
  padding: 0 6px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  font-size: 11px;
  font-family: inherit;
  background: white;
  outline: none;
}

input[type="text"]:hover,
input[type="number"]:hover,
select:hover {
  border-color: #ccc;
}

.controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.buttons {
  display: flex;
  gap: 2px;
}

.buttons button {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  background: white;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.buttons button:hover {
  border-color: #d9d9d9;
  background: #fafafa;
}

.buttons button.active {
  background: #000;
  border-color: #000;
  color: white;
}

input[type="color"] {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  cursor: pointer;
  background: white;
}

input[type="color"]:hover {
  border-color: #d9d9d9;
}

input[type="color"]:focus {
  border-color: #000;
}

::-webkit-inner-spin-button {
  display: none;
}
</style>
