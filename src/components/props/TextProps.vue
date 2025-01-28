<template>
  <div class="text-props">
    <div class="form-item">
      <label>文本内容</label>
      <input type="text" 
             v-model="content" 
             @input="updateProp('content', content)" />
    </div>
    
    <div class="form-item">
      <label>字体颜色</label>
      <input type="color" 
             v-model="color" 
             @input="updateProp('color', color)" />
    </div>
    
    <div class="form-item">
      <label>字体大小</label>
      <input type="number" 
             v-model="fontSize" 
             @input="updateProp('fontSize', Number(fontSize))" />
    </div>
    
    <div class="form-item">
      <label>字体</label>
      <select v-model="fontFamily" 
              @change="updateProp('fontFamily', fontFamily)">
        <option value="Arial">Arial</option>
        <option value="Times New Roman">Times New Roman</option>
        <option value="Helvetica">Helvetica</option>
        <option value="Courier New">Courier New</option>
      </select>
    </div>
    
    <div class="form-item">
      <label>字体样式</label>
      <div class="style-buttons">
        <button :class="{ active: fontWeight === 'bold' }"
                @click="toggleStyle('fontWeight', 'bold', 'normal')">
          加粗
        </button>
        <button :class="{ active: fontStyle === 'italic' }"
                @click="toggleStyle('fontStyle', 'italic', 'normal')">
          斜体
        </button>
        <button :class="{ active: textDecoration.includes('underline') }"
                @click="toggleDecoration('underline')">
          下划线
        </button>
        <button :class="{ active: textDecoration.includes('line-through') }"
                @click="toggleDecoration('line-through')">
          删除线
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Comp } from '../comps/base';

const props = defineProps<{
  component: Comp;
}>();

const emit = defineEmits(['update']);

// 表单数据
const content = ref(props.component.props.content || '');
const color = ref(props.component.props.color || '#333');
const fontSize = ref(props.component.props.fontSize || 14);
const fontFamily = ref(props.component.props.fontFamily || 'Arial');
const fontWeight = ref(props.component.props.fontWeight || 'normal');
const fontStyle = ref(props.component.props.fontStyle || 'normal');
const textDecoration = ref(props.component.props.textDecoration || 'none');

// 监听组件属性变化
watch(() => props.component, (newComp) => {
  content.value = newComp.props.content || '';
  color.value = newComp.props.color || '#333';
  fontSize.value = newComp.props.fontSize || 14;
  fontFamily.value = newComp.props.fontFamily || 'Arial';
  fontWeight.value = newComp.props.fontWeight || 'normal';
  fontStyle.value = newComp.props.fontStyle || 'normal';
  textDecoration.value = newComp.props.textDecoration || 'none';
}, { deep: true });

// 更新属性
function updateProp(key: string, value: any) {
  emit('update', { props: { [key]: value } });
}

// 切换文字样式
function toggleStyle(key: string, value: string, defaultValue: string) {
  const newValue = props.component.props[key] === value ? defaultValue : value;
  updateProp(key, newValue);
}

// 切换文字装饰（下划线、删除线）
function toggleDecoration(value: string) {
  const current = props.component.props.textDecoration || 'none';
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
  
  updateProp('textDecoration', newValue);
}
</script>

<style scoped>
.text-props {
  padding: 16px;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
  color: #666;
}

.form-item input,
.form-item select {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
}

.form-item input[type="color"] {
  padding: 2px;
  height: 32px;
}

.style-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.style-buttons button {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 2px;
  cursor: pointer;
}

.style-buttons button.active {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}
</style>
