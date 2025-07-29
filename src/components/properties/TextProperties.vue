# 文字属性组件
<template>
  <div class="section">
    <div class="section-header">
      <span>文字</span>
    </div>
    <div class="section-content">
      <!-- 文字内容 -->
      <div class="property-row">
        <input type="text" 
               :value="content" 
               @input="updateValue('content', $event)" 
               placeholder="输入文字内容..." />
      </div>
      
      <!-- 宽度模式 -->
      <div class="property-row">
        <label class="property-label">宽度模式</label>
        <div class="radio-group">
          <label class="radio-label">
            <input type="radio" 
                   name="widthMode"
                   value="auto"
                   :checked="(widthMode || 'auto') === 'auto'"
                   @change="updateValue('widthMode', $event)" />
            <span>自动</span>
          </label>
          <label class="radio-label">
            <input type="radio" 
                   name="widthMode"
                   value="fixed"
                   :checked="widthMode === 'fixed'"
                   @change="updateValue('widthMode', $event)" />
            <span>固定</span>
          </label>
        </div>
      </div>
      
      <!-- 自动高度开关 -->
      <div class="property-row">
        <label class="checkbox-label">
          <input type="checkbox" 
                 :checked="autoHeight !== false" 
                 @change="updateValue('autoHeight', $event)" />
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
    </div>
  </div>
</template>

<script setup lang="ts">
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
  // 移除以下两行
  // minWidth?: number;
  // maxWidth?: number;
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
  margin-bottom: 6px;
}

.property-row:last-child {
  margin-bottom: 0;
}

.property-label {
  display: block;
  font-size: 10px;
  color: #666;
  margin-bottom: 2px;
  font-weight: 500;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 11px;
  color: #333;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  height: auto;
  margin: 0;
}

input[type="text"],
input[type="number"],
select {
  width: 100%;
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
  border-color: #d9d9d9;
}

input[type="text"]:focus,
input[type="number"]:focus,
select:focus {
  border-color: #000;
}

.controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.control-group {
  display: flex;
  flex-direction: column;
}

.control-group .property-label {
  margin-bottom: 2px;
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
  padding: 2px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  cursor: pointer;
  background: white;
}

input[type="color"]:hover {
  border-color: #d9d9d9;
}

::-webkit-inner-spin-button {
  display: none;
}

.radio-group {
  display: inline-flex;
  gap: 12px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 11px;
  color: #333;
}

.radio-label input[type="radio"] {
  width: auto;
  height: auto;
  margin: 0;
}

.radio-label span {
  user-select: none;
}
</style>
