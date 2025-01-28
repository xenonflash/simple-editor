<template>
  <canvas ref="canvasRef" :class="['ruler', type]"></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps<{
  type: 'horizontal' | 'vertical';
  scale: number;
  offset: { x: number; y: number };
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

// 标尺配置
const RULER_SIZE = 24; // 标尺宽度/高度
const FONT_SIZE = 10;
const MAJOR_TICK_SIZE = 10; // 主刻度长度
const MINOR_TICK_SIZE = 5;  // 次刻度长度
const UNIT = 50;           // 每个主刻度代表的像素值

// 使用 requestAnimationFrame 优化渲染
let rafId: number | null = null;

// 防抖函数
function debounce(fn: Function, delay: number) {
  let timer: number | null = null;
  return (...args: any[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// 优化渲染函数
function drawRuler() {
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  
  rafId = requestAnimationFrame(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false }); // 禁用 alpha 通道提升性能
    if (!ctx) return;

    // 设置 canvas 尺寸
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    // 根据设备像素比调整 canvas 尺寸
    const dpr = window.devicePixelRatio || 1;
    const isHorizontal = props.type === 'horizontal';
    const width = (isHorizontal ? rect.width : RULER_SIZE) * dpr;
    const height = (isHorizontal ? RULER_SIZE : rect.height) * dpr;

    // 只有尺寸变化时才重设 canvas 尺寸
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = isHorizontal ? rect.width + 'px' : RULER_SIZE + 'px';
      canvas.style.height = isHorizontal ? RULER_SIZE + 'px' : rect.height + 'px';
    }

    // 重置变换并清除画布
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 设置设备像素比缩放
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 批量绘制优化
    ctx.beginPath();
    
    const offset = isHorizontal ? props.offset.x : props.offset.y;
    const size = isHorizontal ? rect.width : rect.height;
    const scaledUnit = UNIT * props.scale;

    // 计算可见区域的刻度范围
    const start = Math.floor(-offset / scaledUnit - 1) * UNIT; // 多显示一个单位，避免边缘问题
    const end = Math.ceil((size - offset) / scaledUnit + 1) * UNIT;
    const step = UNIT / 4;

    // 批量绘制刻度线
    for (let i = start; i <= end; i += step) {
      const pos = Math.round(i * props.scale + offset); // 取整避免小数点导致的模糊
      const isMajor = i % UNIT === 0;
      const tickSize = isMajor ? MAJOR_TICK_SIZE : MINOR_TICK_SIZE;

      if (isHorizontal) {
        ctx.moveTo(pos, RULER_SIZE);
        ctx.lineTo(pos, RULER_SIZE - tickSize);
      } else {
        ctx.moveTo(RULER_SIZE, pos);
        ctx.lineTo(RULER_SIZE - tickSize, pos);
      }
    }

    // 一次性绘制所有刻度线
    ctx.strokeStyle = '#e0e0e0';
    ctx.stroke();

    // 绘制刻度值
    ctx.fillStyle = '#666';
    ctx.font = `${FONT_SIZE}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // 只绘制主刻度的数值
    for (let i = start - (start % UNIT); i <= end; i += UNIT) {
      const pos = Math.round(i * props.scale + offset);
      if (isHorizontal) {
        ctx.fillText(Math.abs(i).toString(), pos, 2);
      } else {
        ctx.save();
        ctx.translate(14, pos);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(Math.abs(i).toString(), 0, 0);
        ctx.restore();
      }
    }
  });
}

// 使用防抖处理 resize
const debouncedDraw = debounce(drawRuler, 100);

// 监听属性变化重绘标尺
watch(() => [props.scale, props.offset.x, props.offset.y], drawRuler, { immediate: true });

// 监听窗口大小变化
onMounted(() => {
  window.addEventListener('resize', debouncedDraw);
  drawRuler();
});

onUnmounted(() => {
  window.removeEventListener('resize', debouncedDraw);
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
});
</script>

<style scoped>
.ruler {
  position: absolute;
  background: #fff;
  border: 1px solid #e0e0e0;
  pointer-events: none;
}

.ruler.horizontal {
  left: 24px;
  right: 0;
  top: 0;
  height: 24px;
}

.ruler.vertical {
  top: 24px;
  bottom: 0;
  left: 0;
  width: 24px;
}
</style>
