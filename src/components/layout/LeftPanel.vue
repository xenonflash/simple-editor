<template>
  <div class="left-panel">
    <div class="panel-title">组件</div>
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
</template>

<script setup lang="ts">
import { CompType } from '../comps/base';

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
  border-right: 1px solid #f0f0f0;
  background: #fafafa;
}

.panel-title {
  padding: 20px 16px 16px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.component-list {
  padding: 0 16px;
}

.component-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease;
  background: white;
  border: 1px solid #e8e8e8;
}

.component-item:hover {
  background: #f5f5f5;
  border-color: #d9d9d9;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.component-item:active {
  cursor: grabbing;
  transform: translateY(0);
}

.icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666;
}

.name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
</style>
