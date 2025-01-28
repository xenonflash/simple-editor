<template>
  <div class="properties-panel">
    <div v-if="props.component" class="panel-content">
      <!-- 标签页头部 -->
      <div class="tabs">
        <button class="tab-button" 
                :class="{ active: activeTab === 'properties' }"
                @click="activeTab = 'properties'">
          属性
        </button>
        <button class="tab-button" 
                :class="{ active: activeTab === 'events' }"
                @click="activeTab = 'events'">
          事件
        </button>
      </div>

      <!-- 标签页内容 -->
      <div class="tab-content">
        <!-- 属性面板 -->
        <div v-show="activeTab === 'properties'">
          <!-- 布局属性 -->
          <div class="section">
            <div class="section-header">
              <span>布局</span>
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

          <!-- 文字属性 -->
          <div v-if="props.component.type === 'text'" class="section">
            <div class="section-header">
              <span>文字</span>
            </div>
            <div class="section-content">
              <div class="property-row">
                <input type="text" 
                       v-model="content" 
                       @input="updateProp('props.content', content)" 
                       placeholder="输入文字内容..." />
              </div>
              <div class="property-row controls">
                <select v-model="fontFamily" 
                        @change="updateProp('props.fontFamily', fontFamily)">
                  <option value="Arial">Arial</option>
                  <option value="PingFang SC">PingFang SC</option>
                  <option value="Microsoft YaHei">微软雅黑</option>
                </select>
                <input type="number" 
                       v-model="fontSize" 
                       @input="updateProp('props.fontSize', Number(fontSize))" />
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
                <button :class="{ active: textDecoration.includes('underline') }"
                        @click="toggleDecoration('underline')">
                  U
                </button>
                <button :class="{ active: textDecoration.includes('line-through') }"
                        @click="toggleDecoration('line-through')">
                  S
                </button>
                <input type="color" 
                       v-model="color" 
                       @input="updateProp('props.color', color)" />
              </div>
            </div>
          </div>
        </div>

        <!-- 事件面板 -->
        <div v-show="activeTab === 'events'">
          <div class="section">
            <div class="section-header">
              <span>事件列表</span>
            </div>
            <div class="section-content">
              <div class="event-list">
                <div v-for="event in events" 
                     :key="event.name" 
                     class="event-item">
                  <div class="event-header">
                    <span>{{ event.label }}</span>
                    <button class="add-button" @click="addEvent(event.name)">
                      添加
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-tip">
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

// 标签页状态
const activeTab = ref('properties');

// 组件属性
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

// 事件列表
const events = [
  { name: 'click', label: '点击' },
  { name: 'dblclick', label: '双击' },
  { name: 'mouseover', label: '悬停' }
];

// 监听组件变化
watch(() => props.component, (comp) => {
  if (comp) {
    // 更新所有属性
    x.value = comp.props.x || 0;
    y.value = comp.props.y || 0;
    width.value = comp.props.width || 0;
    height.value = comp.props.height || 0;
    content.value = comp.props.content || '';
    color.value = comp.props.color || '#333333';
    fontSize.value = comp.props.fontSize || 14;
    fontFamily.value = comp.props.fontFamily || 'Arial';
    fontWeight.value = comp.props.fontWeight || 'normal';
    fontStyle.value = comp.props.fontStyle || 'normal';
    textDecoration.value = comp.props.textDecoration || 'none';
  }
}, { immediate: true, deep: true });

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

// 切换样式
function toggleStyle(key: string, value: string, defaultValue: string) {
  const newValue = props.component?.props[key] === value ? defaultValue : value;
  updateProp(`props.${key}`, newValue);
}

// 切换装饰
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

// 添加事件
function addEvent(eventName: string) {
  console.log('添加事件:', eventName);
  // TODO: 实现事件添加逻辑
}
</script>

<style scoped>
.properties-panel {
  width: 240px;
  background: #ffffff;
  border-left: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 标签页样式 */
.tabs {
  height: 36px;
  display: flex;
  border-bottom: 1px solid #e5e5e5;
  padding: 0 8px;
}

.tab-button {
  height: 36px;
  padding: 0 16px;
  border: none;
  background: none;
  font-size: 11px;
  color: #333;
  cursor: pointer;
  position: relative;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tab-button.active {
  color: #000;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: #000;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}

/* 区块样式 */
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

/* 属性样式 */
.property-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.property-item {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 24px;
}

.property-item label {
  width: 14px;
  font-size: 11px;
  color: #333;
  font-weight: 500;
  text-align: center;
}

.property-row {
  margin-bottom: 4px;
}

.property-row:last-child {
  margin-bottom: 0;
}

/* 输入框样式 */
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

/* 控件组 */
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

/* 事件样式 */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-item {
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  background: white;
}

.event-header {
  padding: 6px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.event-header span {
  font-size: 11px;
  color: #333;
}

.add-button {
  padding: 2px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 2px;
  background: white;
  font-size: 11px;
  color: #333;
  cursor: pointer;
}

.add-button:hover {
  border-color: #000;
  color: #000;
}

/* 空状态 */
.empty-tip {
  padding: 16px;
  text-align: center;
  font-size: 11px;
  color: #999;
}

::-webkit-inner-spin-button {
  display: none;
}
</style>
