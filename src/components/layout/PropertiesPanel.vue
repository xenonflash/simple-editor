<template>
  <div class="properties-panel">
    <!-- 组件属性编辑 -->
    <div v-if="props.component" class="panel-content">
      <!-- 现有的组件属性编辑代码 -->
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
    
    <!-- 页面属性编辑（当无选中组件时自动显示） -->
    <div v-else-if="currentPage" class="panel-content">
      <PageProperties :page="currentPage" />
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">🎨</div>
      <p>暂无内容</p>
      <small>创建页面或添加组件开始编辑</small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Comp } from '../comps/base';
import LayoutProperties from '../properties/LayoutProperties.vue';
import TextProperties from '../properties/TextProperties.vue';
import BorderProperties from '../properties/BorderProperties.vue';
import ShadowProperties from '../properties/ShadowProperties.vue';
import BackgroundProperties from '../properties/BackgroundProperties.vue';
import SpacingProperties from '../properties/SpacingProperties.vue';
import BorderRadiusProperties from '../properties/BorderRadiusProperties.vue';
import { usePageStore } from '../../stores/page';
import PageProperties from '../properties/PageProperties.vue';
import AppIcon from '../icons/AppIcon.vue';

const props = defineProps<{
  component: Comp | null;
}>();

const emit = defineEmits(['update']);

// 只保留一个 pageStore 声明
const pageStore = usePageStore();

// 简化：直接使用当前页面
const currentPage = computed(() => pageStore.currentPage);

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
  height: 100vh; /* 关键：使用视口高度 */
  max-height: 100vh; /* 关键：限制最大高度 */
  background: #ffffff;
  border-left: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  user-select: none;
  overflow: hidden; /* 关键：防止面板本身溢出 */
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0; /* 关键：允许flex子项收缩 */
  height: 100%; /* 关键：确保占满父容器 */
}

/* 标签页样式 */
.tabs {
  height: 36px;
  display: flex;
  border-bottom: 1px solid #e5e5e5;
  padding: 0 8px;
  flex-shrink: 0; /* 防止标签页被压缩 */
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
  overflow-y: auto; /* 只在内容区域滚动 */
  overflow-x: hidden;
  min-height: 0; /* 关键：允许flex子项收缩 */
  height: calc(100% - 36px); /* 关键：减去标签页高度 */
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #d9d9d9 transparent;
}

.tab-content::-webkit-scrollbar {
  width: 6px;
}

.tab-content::-webkit-scrollbar-track {
  background: transparent;
}

.tab-content::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
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
