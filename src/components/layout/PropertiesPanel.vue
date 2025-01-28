<template>
  <div class="properties-panel">
    <div v-if="props.component" class="panel-content">
      <!-- 布局部分 -->
      <div class="section">
        <div class="section-header">
          <div class="section-title">布局</div>
          <div class="section-tools">
            <button class="tool-button">
              <span class="icon">⚡</span>
            </button>
          </div>
        </div>
        <div class="section-content">
          <div class="property-grid">
            <div class="property-item">
              <label>X</label>
              <input type="number" 
                     v-model="x" 
                     @input="updateProp('props.x', Number(x))" />
            </div>
            <div class="property-item">
              <label>Y</label>
              <input type="number" 
                     v-model="y" 
                     @input="updateProp('props.y', Number(y))" />
            </div>
            <div class="property-item">
              <label>W</label>
              <input type="number" 
                     v-model="width" 
                     @input="updateProp('props.width', Number(width))" />
            </div>
            <div class="property-item">
              <label>H</label>
              <input type="number" 
                     v-model="height" 
                     @input="updateProp('props.height', Number(height))" />
            </div>
          </div>
        </div>
      </div>

      <!-- 文字样式部分 -->
      <div v-if="props.component.type === 'text'" class="section">
        <div class="section-header">
          <div class="section-title">文字</div>
        </div>
        <div class="section-content">
          <!-- 文字内容 -->
          <div class="property-row">
            <input type="text" 
                   class="text-content"
                   v-model="content" 
                   @input="updateProp('props.content', content)" 
                   placeholder="输入文字内容..." />
          </div>

          <!-- 字体控制 -->
          <div class="property-row font-controls">
            <select class="font-family" 
                    v-model="fontFamily" 
                    @change="updateProp('props.fontFamily', fontFamily)">
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Helvetica">Helvetica</option>
              <option value="PingFang SC">PingFang SC</option>
            </select>
            <input type="number" 
                   class="font-size"
                   v-model="fontSize" 
                   @input="updateProp('props.fontSize', Number(fontSize))" />
          </div>

          <!-- 文字样式按钮组 -->
          <div class="property-row style-buttons">
            <button :class="{ active: fontWeight === 'bold' }"
                    @click="toggleStyle('fontWeight', 'bold', 'normal')">
              B
            </button>
            <button :class="{ active: fontStyle === 'italic' }"
                    @click="toggleStyle('fontStyle', 'italic', 'normal')">
              I
            </button>
            <button :class="{ active: textDecoration.includes('underline') }"
                    @click="toggleDecoration('underline')">
              U
            </button>
            <button :class="{ active: textDecoration.includes('line-through') }"
                    @click="toggleDecoration('line-through')">
              S
            </button>
            <input type="color" 
                   class="color-picker"
                   v-model="color" 
                   @input="updateProp('props.color', color)" />
          </div>
        </div>
      </div>
    </div>
    <div v-else class="no-selection">
      在画布中选择一个对象以查看属性
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Comp } from '../comps/base';

const props = defineProps<{
  component: Comp | null;
}>();

const emit = defineEmits(['update']);

// 表单数据
const x = ref(0);
const y = ref(0);
const width = ref(0);
const height = ref(0);
const content = ref('');
const color = ref('#333333');
const fontSize = ref(14);
const fontFamily = ref('Arial');
const fontWeight = ref('normal');
const fontStyle = ref('normal');
const textDecoration = ref('none');

// 监听组件变化
watch(() => props.component, (newComp) => {
  if (newComp) {
    x.value = newComp.props.x;
    y.value = newComp.props.y;
    width.value = newComp.props.width || 0;
    height.value = newComp.props.height || 0;
    content.value = newComp.props.content || '';
    color.value = newComp.props.color || '#333333';
    fontSize.value = newComp.props.fontSize || 14;
    fontFamily.value = newComp.props.fontFamily || 'Arial';
    fontWeight.value = newComp.props.fontWeight || 'normal';
    fontStyle.value = newComp.props.fontStyle || 'normal';
    textDecoration.value = newComp.props.textDecoration || 'none';
  }
}, { immediate: true });

// 更新属性
function updateProp(path: string, value: any) {
  const updates: any = {};
  const parts = path.split('.');
  let current = updates;
  
  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = {};
    current = current[parts[i]];
  }
  
  current[parts[parts.length - 1]] = value;
  emit('update', updates);
}

// 切换文字样式
function toggleStyle(key: string, value: string, defaultValue: string) {
  const newValue = props.component?.props[key] === value ? defaultValue : value;
  updateProp(`props.${key}`, newValue);
}

// 切换文字装饰
function toggleDecoration(value: string) {
  const current = props.component?.props.textDecoration || 'none';
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
  
  updateProp('props.textDecoration', newValue);
}
</script>

<style scoped>
.properties-panel {
  width: 240px;
  background: white;
  border-left: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
}

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

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
}

.section-tools {
  display: flex;
  gap: 4px;
}

.tool-button {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  border-radius: 2px;
  cursor: pointer;
}

.tool-button:hover {
  background: #e5e5e5;
}

.section-content {
  padding: 8px;
}

.property-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.property-row {
  margin-bottom: 8px;
}

.property-row:last-child {
  margin-bottom: 0;
}

.property-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.property-item label {
  width: 16px;
  font-size: 11px;
  color: #333;
}

input[type="number"],
input[type="text"],
select {
  width: 100%;
  height: 24px;
  padding: 0 4px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  font-size: 11px;
  outline: none;
}

input[type="number"]:focus,
input[type="text"]:focus,
select:focus {
  border-color: #1890ff;
}

.text-content {
  width: 100%;
}

.font-controls {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 8px;
}

.style-buttons {
  display: flex;
  gap: 4px;
}

.style-buttons button {
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #e5e5e5;
  background: white;
  border-radius: 2px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.style-buttons button:hover {
  background: #fafafa;
}

.style-buttons button.active {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.color-picker {
  width: 24px;
  height: 24px;
  padding: 2px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  cursor: pointer;
}

.no-selection {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 12px;
}

::-webkit-inner-spin-button {
  display: none;
}
</style>
