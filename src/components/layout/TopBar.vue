<template>
  <div class="topbar">
    <div class="logo">低代码平台</div>
    <div class="actions">
      <!-- 这里可以添加预览、保存等操作按钮 -->
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.topbar {
  height: 48px;
  background-color: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  padding: 0 16px;
  justify-content: space-between;
}

.logo {
  font-size: 16px;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 16px;
}
</style>
