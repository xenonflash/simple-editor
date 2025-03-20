<template>
  <div class="topbar">
    <div class="logo">Hello</div>
    <div class="actions">
      <button class="action-btn">页面</button>
      <button class="action-btn">流程</button>
      <button class="action-btn">数据</button>
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
  gap: 12px;
}

.action-btn {
  padding: 6px 16px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: 14px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: #f5f5f5;
}

.action-btn:active {
  background-color: #e8e8e8;
}
</style>
