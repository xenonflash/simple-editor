<template>
  <div class="board">
    <div class="canvas">
      <!-- 这里是画布区域，用于拖拽组件和预览 -->
      <div class="placeholder">
        拖拽组件到此处开始设计
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.board {
  flex: 1;
  height: 100%;
  background-color: #f5f5f5;
  padding: 20px;
  overflow: auto;
}

.canvas {
  min-height: 100%;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder {
  color: #999;
  font-size: 14px;
}
</style>
