<template>
  <div class="right-panel">
    <div class="properties-panel">
      <div class="panel-title">属性配置</div>
      <div class="properties-container">
        <!-- 属性配置表单将在这里动态渲染 -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.right-panel {
  width: 300px;
  background-color: #fff;
  border-left: 1px solid #e8e8e8;
  height: 100%;
}

.panel-title {
  padding: 16px;
  font-weight: bold;
  border-bottom: 1px solid #e8e8e8;
}

.properties-container {
  padding: 16px;
}
</style>
