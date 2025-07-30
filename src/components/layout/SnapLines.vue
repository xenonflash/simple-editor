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
    lines,
    scale: props.scale,
    offset: props.offset
  })
  return lines
})

const getLineStyle = (line: any) => {
  const baseStyle = {
    position: 'absolute',
    backgroundColor: '#ff4757',
    zIndex: '9999',
    pointerEvents: 'none'
  }

  if (line.type === 'horizontal') {
    // 直接使用画布坐标，不进行额外变换
    const style = {
      ...baseStyle,
      left: `${line.x1}px`,
      top: `${line.y1}px`,
      width: `${line.x2 - line.x1}px`,
      height: '1px'
    }
    console.log('Horizontal line style:', { line, style })
    return style
  } else {
    // 直接使用画布坐标，不进行额外变换
    const style = {
      ...baseStyle,
      left: `${line.x1}px`,
      top: `${line.y1}px`,
      width: '1px',
      height: `${line.y2 - line.y1}px`
    }
    console.log('Vertical line style:', { line, style })
    return style
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