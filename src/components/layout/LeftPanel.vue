<template>
  <div class="left-panel">
    <div class="panel-title">组件</div>
    <div class="component-list">
      <div class="component-item"
           draggable="true"
           @dragstart="handleDragStart(CompType.CONTAINER)">
        <div class="icon">📦</div>
        <div class="name">容器</div>
      </div>
      <div class="component-item"
           draggable="true"
           @dragstart="handleDragStart(CompType.TEXT)">
        <div class="icon">📝</div>
        <div class="name">文字</div>
      </div>
      <div class="component-item"
           draggable="true"
           @dragstart="handleDragStart(CompType.BUTTON)">
        <div class="icon">🔘</div>
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
  color: #2c3e50;
  border-bottom: 1px solid #f0f0f0;
  background: white;
}

.component-list {
  padding: 20px 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  cursor: grab;
  transition: all 0.3s ease;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  user-select: none;
}

.component-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.component-item:active {
  cursor: grabbing;
  transform: translateY(0);
}

.component-item .icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.component-item .name {
  font-size: 12px;
  color: #555;
  text-align: center;
  font-weight: 500;
}
</style>
