<template>
  <div class="section">
    <div class="section-header">
      <span>{{ title }}</span>
      <!-- head slot 用于放置额外的头部控件，如圆角属性的slider -->
      <slot name="head"></slot>
    </div>
    <div class="section-content">
      <!-- content slot 用于放置具体的面板内容 -->
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<style scoped>
.section {
  border-bottom: 1px solid #e5e5e5;
}

.section-header {
  height: 32px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f3f3f3;
}

.section-header span {
  font-size: 11px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-content {
  padding: 8px;
}
</style>