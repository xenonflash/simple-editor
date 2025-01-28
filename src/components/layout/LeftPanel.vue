<template>
  <div class="left-panel">
    <div class="panel-title">组件</div>
    <div class="components-list">
      <div class="component-item"
           draggable="true"
           @dragstart="handleDragStart">
        <div class="component-icon">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="component-name">容器</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CompType } from '../comps/base';

function handleDragStart(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('component-type', CompType.CONTAINER);
  }
}
</script>

<style scoped>
.left-panel {
  width: 280px;
  background: #fff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.panel-title {
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
}

.components-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: move;
  transition: all 0.2s;
}

.component-item:hover {
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.04);
}

.component-icon {
  width: 24px;
  height: 24px;
  color: #666;
}

.component-name {
  font-size: 14px;
  color: #333;
}
</style>
