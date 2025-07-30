<template>
  <div class="board-toolbar">
    <div class="button-group">
      <button @click="$emit('undo')" :disabled="!canUndo" data-tooltip="撤销 (⌘Z)">
        <span class="icon">↩</span>
        <span class="text">撤销</span>
      </button>
      <button @click="$emit('redo')" :disabled="!canRedo" data-tooltip="重做 (⌘⇧Z)">
        <span class="icon">↪</span>
        <span class="text">重做</span>
      </button>
    </div>

    <div class="divider"></div>

    <div class="zoom-controls">
      <button @click="$emit('zoomOut')" data-tooltip="缩小 (⌘-)">
        <span class="icon">－</span>
      </button>
      <span class="zoom-value">{{ Math.round(scale * 100) }}%</span>
      <button @click="$emit('zoomIn')" data-tooltip="放大 (⌘+)">
        <span class="icon">＋</span>
      </button>
      <button @click="$emit('resetZoom')" data-tooltip="重置缩放 (⌘0)">
        <span class="icon">↺</span>
      </button>
    </div>

    <div class="divider"></div>

    <button class="delete-button" 
            @click="$emit('delete')" 
            :disabled="!selected"
            data-tooltip="删除 (Delete)">
      <span class="icon">🗑</span>
      <span class="text">删除</span>
    </button>

    <div class="divider"></div>

    <div class="button-group">
      <button @click="$emit('bringToFront')" 
              :disabled="!selected"
              data-tooltip="置于顶层">
        <span class="icon">⬆</span>
      </button>
      <button @click="$emit('bringForward')" 
              :disabled="!selected"
              data-tooltip="上移一层">
        <span class="icon">↑</span>
      </button>
      <button @click="$emit('sendBackward')" 
              :disabled="!selected"
              data-tooltip="下移一层">
        <span class="icon">↓</span>
      </button>
      <button @click="$emit('sendToBack')" 
              :disabled="!selected"
              data-tooltip="置于底层">
        <span class="icon">⬇</span>
      </button>
    </div>

    <div class="divider"></div>

    <div class="button-group">
      <button @click="$emit('export')" data-tooltip="导出到JSON">
        <span class="icon">⬇</span>
        <span class="text">导出</span>
      </button>
      <button @click="$emit('import')" data-tooltip="从JSON导入">
        <span class="icon">⬆</span>
        <span class="text">导入</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

defineProps({
  canUndo: Boolean,
  canRedo: Boolean,
  scale: {
    type: Number,
    default: 1
  },
  selected: Boolean
});

defineEmits([
  'undo', 'redo', 'zoomOut', 'zoomIn', 'resetZoom', 'delete',
  'bringToFront', 'bringForward', 'sendBackward', 'sendToBack',
  'export', 'import'
]);
</script>

<style scoped>
.board-toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 100;
  transition: all 0.3s ease;
  max-width: 90vw;
}

.board-toolbar:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
  transform: translateX(-50%) translateY(-1px);
}

.button-group, .zoom-controls {
  display: flex;
  align-items: center;
  gap: 2px;
}

button {
  background: none;
  border: none;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #333;
  font-size: 11px;
  transition: background-color 0.2s ease;
  position: relative;
  white-space: nowrap;
  min-width: auto;
}

button:hover {
  background-color: #f5f5f5;
}

button:disabled {
  color: #ccc;
  cursor: not-allowed;
  background-color: transparent;
}

.icon {
  font-size: 14px;
  line-height: 1;
}

.text {
  font-weight: 500;
  font-size: 10px;
}

.divider {
  width: 1px;
  height: 16px;
  background-color: #e0e0e0;
  margin: 0 2px;
}

.zoom-value {
  padding: 0 6px;
  font-size: 11px;
  color: #555;
  min-width: 35px;
  text-align: center;
  font-weight: 500;
}

.delete-button {
  color: #e53e3e;
}

.delete-button:hover:not(:disabled) {
  background-color: #fed7d7;
}

/* Tooltip styles */
[data-tooltip] {
  position: relative;
}

[data-tooltip]::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 6px;
  background-color: #333;
  color: white;
  padding: 3px 6px;
  border-radius: 3px;
  font-size: 10px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 101;
}

[data-tooltip]:hover::after {
  opacity: 1;
  visibility: visible;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .text {
    display: none;
  }
  
  button {
    padding: 6px;
  }
  
  .board-toolbar {
    gap: 2px;
  }
}
</style>