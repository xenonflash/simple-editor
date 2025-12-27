<template>
  <div class="left-panel">
    <div class="scroll-content">
      <!-- 组件区域 -->
      <div class="panel-section">
        <div class="panel-title">基础组件</div>
        <div class="component-list">
          <div class="component-item"
               draggable="true"
               @dragstart="handleDragStart(CompType.CONTAINER)">
            <div class="icon">
              <AppIcon name="box" />
            </div>
            <div class="name">容器</div>
          </div>
          <div class="component-item"
               draggable="true"
               @dragstart="handleDragStart(CompType.TEXT)">
            <div class="icon">
              <AppIcon name="file-alt" />
            </div>
            <div class="name">文字</div>
          </div>
          <div class="component-item"
               draggable="true"
               @dragstart="handleDragStart(CompType.BUTTON)">
            <div class="icon">
              <AppIcon name="circle" />
            </div>
            <div class="name">按钮</div>
          </div>
        </div>
      </div>

      <!-- Naive UI 组件区域 -->
      <div class="panel-section">
        <div class="panel-title">Naive UI 组件</div>
        <div class="component-list">
          <div v-for="item in naiveComponentRegistry"
               :key="item.type"
               class="component-item"
               draggable="true"
               @dragstart="handleDragStart(item.type)">
            <div class="icon">
              <AppIcon :name="item.icon" />
            </div>
            <div class="name">{{ item.name }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 页面管理区域 -->
    <div class="panel-section fixed-section">
      <PageManagerVertical />
    </div>
  </div>
</template>

<script setup lang="ts">
import { CompType } from '../comps/base';
import PageManagerVertical from './PageManagerVertical.vue';
import { naiveComponentRegistry } from '../../config/naive-ui-registry';

function handleDragStart(type: CompType) {
  // 设置拖拽数据
  const event = window.event as DragEvent;
  if (event.dataTransfer) {
    event.dataTransfer.setData('componentType', type);
    event.dataTransfer.effectAllowed = 'copy';
  }
}
</script>

<style scoped>
.left-panel {
  width: 240px;
  height: 100vh; /* 使用视口高度 */
  max-height: 100vh; /* 限制最大高度 */
  border-right: 1px solid #f0f0f0;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止溢出 */
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 16px;
}

/* 自定义滚动条样式 */
.scroll-content::-webkit-scrollbar {
  width: 6px;
}

.scroll-content::-webkit-scrollbar-thumb {
  background-color: #e0e0e0;
  border-radius: 3px;
}

.scroll-content::-webkit-scrollbar-track {
  background-color: transparent;
}

.panel-section {
  flex-shrink: 0;
}

.fixed-section {
  border-top: 1px solid #f0f0f0;
  background: #fff;
  z-index: 10;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
}

.panel-section:not(:last-child) {
  /* border-bottom: 1px solid #f0f0f0; */
  /* margin-bottom: 16px; */
  /* padding-bottom: 16px; */
}

.panel-title {
  padding: 20px 16px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.component-list {
  padding: 0 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 4px;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease;
  background: white;
  border: 1px solid #e8e8e8;
  height: 30px;
}

.component-item:hover {
  background: #f5f5f5;
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
}

.component-item:active {
  cursor: grabbing;
  transform: translateY(0);
}

.icon {
  width: 24px;
  height: 24px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: inherit;
}

.name {
  font-size: 12px;
  color: inherit;
  font-weight: 500;
  text-align: center;
}
</style>
