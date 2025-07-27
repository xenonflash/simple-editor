# 文字属性组件
<template>
  <div class="section">
    <div class="section-header">
      <span>文字</span>
    </div>
    <div class="section-content">
      <div class="property-row">
        <input type="text" 
               :value="content" 
               @input="updateValue('content', $event)" 
               placeholder="输入文字内容..." />
      </div>
      <div class="property-row controls">
        <select :value="fontFamily" 
                @change="updateValue('fontFamily', $event)">
          <option value="Arial">Arial</option>
          <option value="PingFang SC">PingFang SC</option>
          <option value="Microsoft YaHei">微软雅黑</option>
        </select>
        <input type="number" 
               :value="fontSize" 
               @input="updateValue('fontSize', $event)" />
      </div>
      <div class="property-row buttons">
        <button :class="{ active: fontWeight === 'bold' }"
                @click="toggleStyle('fontWeight', 'bold', 'normal')">
          B
        </button>
        <button :class="{ active: fontStyle === 'italic' }"
                @click="toggleStyle('fontStyle', 'italic', 'normal')">
          I
        </button>
        <button :class="{ active: textDecoration?.includes('underline') }"
                @click="toggleDecoration('underline')">
          U
        </button>
        <button :class="{ active: textDecoration?.includes('line-through') }"
                @click="toggleDecoration('line-through')">
          S
        </button>
        <input type="color" 
               :value="color" 
               @input="updateValue('color', $event)" />
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
}>();

const emit = defineEmits(['update']);

function updateValue(key: string, event: Event) {
  const target = event.target as HTMLInputElement;
  let value = target.type === 'number' ? Number(target.value) : target.value;
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
  margin-bottom: 4px;
}

.property-row:last-child {
  margin-bottom: 0;
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
  grid-template-columns: 2fr 1fr;
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
</style>
