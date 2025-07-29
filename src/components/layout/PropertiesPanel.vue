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
          <LayoutProperties 
            :x="props.component.props.x || 0"
            :y="props.component.props.y || 0"
            :width="props.component.props.width"
            :height="props.component.props.height"
            @update="updateProps" />

          <SpacingProperties v-bind="props.component.props"
                           @update="updateProps" />

          <!-- 文字属性 -->
          <TextProperties v-if="props.component.type === 'text' || props.component.type === 'button'"
                         :content="props.component.props.content || ''"
                         :color="props.component.props.color"
                         :fontSize="props.component.props.fontSize"
                         :fontWeight="props.component.props.fontWeight"
                         :fontFamily="props.component.props.fontFamily"
                         :textDecoration="props.component.props.textDecoration"
                         :fontStyle="props.component.props.fontStyle"
                         :width="props.component.props.width"
                         :height="props.component.props.height"
                         :widthMode="props.component.props.widthMode"
                         :autoHeight="props.component.props.autoHeight"
                         @update="updateProps" />

          <BorderProperties v-bind="props.component.props"
                          @update="updateProps" />

          <BorderRadiusProperties v-bind="props.component.props"
                               @update="updateProps" />

          <ShadowProperties v-bind="props.component.props"
                          @update="updateProps" />

          <BackgroundProperties v-bind="props.component.props"
                          @update="updateProps" />

          
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
import { ref } from 'vue';
import type { Comp } from '../comps/base';
import LayoutProperties from '../properties/LayoutProperties.vue';
import TextProperties from '../properties/TextProperties.vue';
import BorderProperties from '../properties/BorderProperties.vue';
import ShadowProperties from '../properties/ShadowProperties.vue';
import BackgroundProperties from '../properties/BackgroundProperties.vue';
import SpacingProperties from '../properties/SpacingProperties.vue';
import BorderRadiusProperties from '../properties/BorderRadiusProperties.vue';

const props = defineProps<{
  component: Comp | null;
}>();

const emit = defineEmits(['update']);

// 标签页状态
const activeTab = ref('properties');

// 事件列表
const events = [
  { name: 'click', label: '点击' },
  { name: 'dblclick', label: '双击' },
  { name: 'mouseover', label: '悬停' }
];

// 更新属性
function updateProps(updates: Record<string, any>) {
  if (!props.component) return;
  
  // 处理数值类型的属性
  const processedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
    if (typeof value === 'string' && !isNaN(Number(value))) {
      acc[key] = Number(value);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);

  emit('update', {
    id: props.component.id,
    type: props.component.type,
    props: processedUpdates
  });
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

/* 空状态 */
.empty-tip {
  padding: 16px;
  text-align: center;
  font-size: 11px;
  color: #999;
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
</style>
