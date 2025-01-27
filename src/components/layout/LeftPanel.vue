<template>
  <div class="left-panel">
    <div class="components-list">
      <!-- 这里将放置可拖拽的组件列表 -->
      <div class="panel-title">组件库</div>
      <div class="components-container">
        <!-- 组件列表将在这里动态渲染 -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.left-panel {
  width: 280px;
  background-color: #fff;
  border-right: 1px solid #e8e8e8;
  height: 100%;
}

.panel-title {
  padding: 16px;
  font-weight: bold;
  border-bottom: 1px solid #e8e8e8;
}

.components-container {
  padding: 16px;
}
</style>
