<template>
  <div class="left-panel">
    <div class="panel-title">组件</div>
    <div class="component-list">
      <div class="component-item"
           draggable="true"
           @dragstart="handleDragStart(CompType.CONTAINER)">
        <div class="icon">□</div>
        <div class="name">容器</div>
      </div>
      <div class="component-item"
           draggable="true"
           @dragstart="handleDragStart(CompType.TEXT)">
        <div class="icon">T</div>
        <div class="name">文字</div>
      </div>
      <div class="component-item"
           draggable="true"
           @dragstart="handleDragStart(CompType.BUTTON)">
        <div class="icon">⬜</div>
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
  border-right: 1px solid #e0e0e0;
  background: white;
}

.panel-title {
  padding: 16px;
  font-size: 16px;
  font-weight: bold;
  border-bottom: 1px solid #e0e0e0;
}

.component-list {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: move;
  user-select: none;
  transition: all 0.3s;
}

.component-item:hover {
  border-color: #1890ff;
  background: #e6f7ff;
}

.component-item .icon {
  font-size: 24px;
  margin-bottom: 8px;
  color: #666;
}

.component-item .name {
  font-size: 12px;
  color: #666;
}
</style>
