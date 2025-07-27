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
const BASE_UNIT = 50;      // 基础刻度单位（像素值）

// 根据缩放比例计算合适的刻度单位
function getOptimalUnit(scale: number): { unit: number; step: number; minorStep: number } {
  // 定义不同的刻度级别，基于缩放比例
  // 缩放比例越小，使用越大的刻度单位，避免密集显示
  const levels = [
    { minScale: 4.0, unit: 10, step: 2, minorStep: 1 },       // 高缩放：10px主刻度
    { minScale: 2.0, unit: 25, step: 5, minorStep: 2.5 },     // 较高缩放：25px主刻度
    { minScale: 1.0, unit: 50, step: 10, minorStep: 5 },      // 标准缩放1:1：50px主刻度
    { minScale: 0.5, unit: 100, step: 25, minorStep: 10 },    // 中等缩放：100px主刻度
    { minScale: 0.25, unit: 200, step: 50, minorStep: 25 },   // 较小缩放：200px主刻度
    { minScale: 0.125, unit: 500, step: 100, minorStep: 50 }, // 小缩放：500px主刻度
    { minScale: 0.0625, unit: 1000, step: 200, minorStep: 100 }, // 很小缩放：1000px主刻度
    { minScale: 0, unit: 2000, step: 500, minorStep: 200 }    // 极小缩放：2000px主刻度
  ];
  
  // 选择合适的刻度级别
  for (const level of levels) {
    if (scale >= level.minScale) {
      return {
        unit: level.unit,
        step: level.step,
        minorStep: level.minorStep
      };
    }
  }
  
  // 默认返回最大级别
  return { unit: 2000, step: 500, minorStep: 200 };
}

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
    
    // 获取当前缩放比例下的最优刻度单位
    const { unit, step, minorStep } = getOptimalUnit(props.scale);
    const scaledUnit = unit * props.scale;

    // 计算可见区域的刻度范围
    const start = Math.floor(-offset / scaledUnit - 1) * unit;
    const end = Math.ceil((size - offset) / scaledUnit + 1) * unit;

    // 批量绘制刻度线（包括主刻度和次刻度）
    // 使用更精确的步长计算，避免浮点数精度问题
    const stepCount = Math.round((end - start) / minorStep);
    for (let j = 0; j <= stepCount; j++) {
      const i = start + j * minorStep;
      const pos = Math.round(i * props.scale + offset);
      
      // 使用更精确的模运算判断，避免浮点数精度问题
      const isMajor = Math.abs(i % unit) < 0.001;
      const isMinor = Math.abs(i % step) < 0.001;
      
      // 跳过不需要显示的刻度
      if (!isMajor && !isMinor) continue;
      
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

    // 只绘制主刻度的数值，并确保数字不会重叠
    const labelStep = unit;
    const labelStart = Math.ceil(start / labelStep) * labelStep;
    const labelEnd = Math.floor(end / labelStep) * labelStep;
    
    for (let i = labelStart; i <= labelEnd; i += labelStep) {
      // 避免浮点数精度问题
      const roundedI = Math.round(i * 100) / 100;
      const pos = Math.round(roundedI * props.scale + offset);
      
      // 检查标签是否在可见区域内
      if (pos < -20 || pos > (isHorizontal ? rect.width : rect.height) + 20) continue;
      
      // 格式化数字显示，避免小数点
      const labelText = Math.abs(Math.round(roundedI)).toString();
      
      if (isHorizontal) {
        ctx.fillText(labelText, pos, 2);
      } else {
        ctx.save();
        ctx.translate(14, pos);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(labelText, 0, 0);
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
