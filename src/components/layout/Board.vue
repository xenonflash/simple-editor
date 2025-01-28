<template>
  <div class="board">
    <div class="toolbar">
      <button @click="zoomIn">放大</button>
      <button @click="zoomOut">缩小</button>
      <button @click="resetZoom">重置</button>
      <span>{{ Math.round(scale * 100) }}%</span>
    </div>
    <div class="canvas-wrapper" 
         ref="wrapperRef"
         @wheel="handleWheel"
         @mousedown="startPan"
         @mousemove="doPan"
         @mouseup="endPan"
         @mouseleave="endPan">
      <div class="canvas"
           :style="canvasStyle" 
           ref="canvasRef"
           @dragover="handleDragOver"
           @drop="handleDrop"
           @mousedown.stop="handleCanvasClick">
        <div class="canvas-content"
             :style="contentStyle">
          <Container v-for="comp in props.components"
                    :key="comp.id"
                    :width="comp.props.width"
                    :height="comp.props.height"
                    :x="comp.props.x"
                    :y="comp.props.y"
                    :scale="scale"
                    :selected="selectedId === comp.id"
                    @select="handleSelect(comp.id)"
                    @update="(updates) => handleUpdatePosition(comp.id, updates)" />
          <div class="placeholder" v-if="props.components.length === 0">
            拖拽组件到此处开始设计
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import Container from '../comps/Container.vue';
import type { Comp } from '../comps/base';
import { CompType, createComp } from '../comps/base';

// 引用
const wrapperRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null);

const props = defineProps<{
  components: Comp[];
  selectedId?: string | null;
}>();

const emit = defineEmits<{
  (e: 'select', id: string | null): void;
  (e: 'update', comp: Comp): void;
  (e: 'add', comp: Comp): void;
}>();

// 调试模式
const DEBUG = true;
function log(...args: any[]) {
  if (DEBUG) console.log('[Board]', ...args);
}

// 缩放相关
const scale = ref(1);
const minScale = 0.1;
const maxScale = 3;
const scaleStep = 0.1;

// 视口中心点
const viewportCenter = ref({ x: 0, y: 0 });

// 更新视口中心点
function updateViewportCenter() {
  if (wrapperRef.value) {
    const rect = wrapperRef.value.getBoundingClientRect();
    viewportCenter.value = {
      x: rect.width / 2,
      y: rect.height / 2
    };
  }
}

// 在组件挂载和窗口大小变化时更新视口中心点
onMounted(() => {
  updateViewportCenter();
  window.addEventListener('resize', updateViewportCenter);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateViewportCenter);
});

// 缩放函数
function zoomIn() {
  setScale(scale.value + scaleStep);
}

function zoomOut() {
  setScale(scale.value - scaleStep);
}

function resetZoom() {
  setScale(1);
}

// 处理缩放，保持鼠标位置不变
function setScale(newScale: number, center?: { x: number, y: number }) {
  const oldScale = scale.value;
  // 限制缩放范围并使缩放更平滑
  newScale = Math.max(minScale, Math.min(maxScale, newScale));
  
  if (Math.abs(newScale - oldScale) < 0.00001) return;

  // 如果没有指定缩放中心，使用视口中心
  const zoomCenter = center || viewportCenter.value;
  
  // 计算缩放前后的偏移差
  const scaleFactor = newScale / oldScale;
  const dx = (zoomCenter.x - panOffset.value.x) * (1 - scaleFactor);
  const dy = (zoomCenter.y - panOffset.value.y) * (1 - scaleFactor);
  
  // 更新缩放和偏移
  scale.value = newScale;
  panOffset.value = {
    x: panOffset.value.x + dx,
    y: panOffset.value.y + dy
  };
}

// 处理触控板手势
function handleWheel(e: WheelEvent) {
  e.preventDefault();
  
  // 获取鼠标相对于视口的位置
  const rect = wrapperRef.value?.getBoundingClientRect();
  if (!rect) return;
  
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // 检测是否是缩放手势（触控板双指捏合或 Command + 滚轮）
  if (e.ctrlKey || e.metaKey) {
    const delta = -e.deltaY;
    // 调整缩放系数使触控板的缩放更加平滑
    const zoomFactor = Math.pow(1.01, delta);
    setScale(scale.value * zoomFactor, { x: mouseX, y: mouseY });
    return;
  }

  // 处理平移
  // 根据设备像素比调整平移速度
  const pixelRatio = window.devicePixelRatio || 1;
  const dx = e.deltaX / pixelRatio;
  const dy = e.deltaY / pixelRatio;

  panOffset.value = {
    x: panOffset.value.x - dx,
    y: panOffset.value.y - dy
  };
}

// 画布样式
const canvasStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: '0 0',
}));

const contentStyle = computed(() => ({
  transform: `translate(${panOffset.value.x}px, ${panOffset.value.y}px)`,
}));

// 画布拖动
const isPanning = ref(false);
const startPanPos = ref({ x: 0, y: 0 });
const panOffset = ref({ x: 0, y: 0 });

function startPan(e: MouseEvent) {
  // 空格键 + 鼠标左键 或 鼠标中键可以平移
  if ((e.button === 0 && e.getModifierState('Space')) || e.button === 1) {
    e.preventDefault();
    isPanning.value = true;
    startPanPos.value = {
      x: e.clientX - panOffset.value.x,
      y: e.clientY - panOffset.value.y
    };
  }
}

function doPan(e: MouseEvent) {
  if (!isPanning.value) return;
  e.preventDefault();
  panOffset.value = {
    x: e.clientX - startPanPos.value.x,
    y: e.clientY - startPanPos.value.y
  };
}

function endPan() {
  isPanning.value = false;
}

// 处理画布点击
function handleCanvasClick(e: MouseEvent) {
  if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-content')) {
    emit('select', null);
    log('Canvas clicked, deselect component');
  }
}

// 处理组件选中
function handleSelect(id: string) {
  emit('select', id);
  log('Component selected:', id);
}

// 处理组件位置更新
function handleUpdatePosition(id: string, updates: { x?: number; y?: number; width?: number; height?: number }) {
  const comp = props.components.find(c => c.id === id);
  if (!comp) return;

  emit('update', {
    ...comp,
    props: {
      ...comp.props,
      ...updates
    }
  });
}

// 处理拖拽
function handleDragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy';
  }
}

// 从屏幕坐标转换为画布坐标
function screenToCanvas(screenX: number, screenY: number): { x: number, y: number } {
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return { x: 0, y: 0 };

  // 考虑缩放和平移的影响
  return {
    x: (screenX - rect.left - panOffset.value.x) / scale.value,
    y: (screenY - rect.top - panOffset.value.y) / scale.value
  };
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  const compType = e.dataTransfer?.getData('component-type');
  if (!compType) return;

  // 转换拖放位置到画布坐标
  const { x, y } = screenToCanvas(e.clientX, e.clientY);

  // 创建新组件
  const newComp = createComp(compType as CompType, '新容器');
  newComp.props = {
    x,
    y,
    width: 200,
    height: 100
  };

  emit('add', newComp);
  log('Drop component:', newComp);
}
</script>

<style scoped>
.board {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
  position: relative;
  user-select: none;
}

.toolbar {
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  gap: 8px;
  align-items: center;
  background: #fff;
}

.toolbar button {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar button:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.canvas-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  cursor: default;
}

.canvas-wrapper.is-panning {
  cursor: grab;
}

.canvas-wrapper.is-panning:active {
  cursor: grabbing;
}

.canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  overflow: visible;
}

.canvas-content {
  width: 100%;
  height: 100%;
  position: relative;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}

.placeholder {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 14px;
  pointer-events: none;
}
</style>
