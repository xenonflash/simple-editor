<template>
  <Transition name="drop-preview">
    <div v-if="store.preview.value.active" class="drop-preview-layer">
      <div class="container-outline" :style="containerStyle" />
      <div class="ghost" :style="ghostStyle" />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, inject } from 'vue'
import { DROP_PREVIEW_STORE_KEY } from './useDropPreviewStore'

const store = inject(DROP_PREVIEW_STORE_KEY)
if (!store) {
  throw new Error('DropPreviewBox must be used under DropPreviewStore provider')
}

const containerStyle = computed(() => {
  const rect = store.preview.value.containerRect
  if (!rect) return {}
  return {
    left: rect.x + 'px',
    top: rect.y + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px'
  } satisfies CSSProperties
})

const ghostStyle = computed(() => {
  const rect = store.preview.value.ghostRect
  if (!rect) return {}
  return {
    left: rect.x + 'px',
    top: rect.y + 'px',
    width: rect.width + 'px',
    height: rect.height + 'px'
  } satisfies CSSProperties
})
</script>

<style scoped>
.drop-preview-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* 必须高于组件 wrapper 的 zIndex（组件通常是 1000+） */
  z-index: 2000;
}

.container-outline {
  position: absolute;
  border: 2px dashed #1890ff;
  background: rgba(24, 144, 255, 0.04);
  box-sizing: border-box;
  transition: opacity 160ms ease, transform 160ms ease;
}

.ghost {
  position: absolute;
  border: 1px dashed rgba(24, 144, 255, 0.9);
  background: rgba(24, 144, 255, 0.12);
  box-sizing: border-box;
  transition: opacity 160ms ease, transform 160ms ease;
}

.drop-preview-enter-active,
.drop-preview-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.drop-preview-enter-from,
.drop-preview-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.drop-preview-enter-to,
.drop-preview-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
