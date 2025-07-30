<template>
  <div class="snap-lines">
    <div 
      v-for="line in snapLines" 
      :key="line.id"
      class="snap-line"
      :class="line.type"
      :style="getLineStyle(line)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSnaplineStore } from '../../stores/snapline'
import type { SnapLine } from '../../stores/snapline'

interface Props {
  scale: number
  offset: { x: number; y: number }
}

const props = defineProps<Props>()
const snaplineStore = useSnaplineStore()

const snapLines = computed(() => {
  const lines = snaplineStore.snapLines
  console.log('SnapLines computed:', {
    linesCount: lines.length,
    lines
  })
  return lines
})

function getLineStyle(line: SnapLine): Record<string, string> {
  if (line.type === 'horizontal') {
    return {
      position: 'absolute',
      left: '0px',
      top: `${line.y1}px`,
      width: '100%',
      height: '1px',
      backgroundColor: '#ff6b6b',
      zIndex: '1000',
      pointerEvents: 'none'
    }
  } else {
    return {
      position: 'absolute',
      left: `${line.x1}px`,
      top: '0px',
      width: '1px',
      height: '100%',
      backgroundColor: '#ff6b6b',
      zIndex: '1000',
      pointerEvents: 'none'
    }
  }
}
</script>

<style scoped>
.snap-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
}

.snap-line {
  box-shadow: 0 0 0 0.5px rgba(255, 255, 255, 0.8);
  animation: snapFadeIn 0.15s ease-out;
}

@keyframes snapFadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>