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
      left: '0px',
      top: `${line.y1}px`,
      width: "100%",
      height: "1px"
    }
  } else {
    return {
      left: `${line.x1}px`,
      top: '0px',
      width: '1px',
      height: '100%'
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
  position: absolute;
  
  background-color: rgba(202, 126, 237, 0.886);
  z-index: 1000;
  pointer-events: none
}
</style>