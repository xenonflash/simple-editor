<template>
  <div v-if="showIndicator" class="mock-indicator">
    <span class="mock-badge">Mock 模式</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showIndicator = ref(false)

onMounted(async () => {
  const { isMockEnabled } = await import('@/mock')
  showIndicator.value = isMockEnabled()
})
</script>

<style scoped>
.mock-indicator {
  position: fixed;
  top: 10px;
  left: 200px;
  transform: translateX(-50%);
  /* z-index: 9999; */
  pointer-events: none; /* 避免阻挡点击事件 */
}

.mock-badge {
  background: #f0ad4e;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  display: inline-block;
}
</style>