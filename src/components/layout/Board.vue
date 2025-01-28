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
import { ref, computed } from 'vue';
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

function zoomIn() {
  scale.value = Math.min(scale.value + scaleStep, maxScale);
}

function zoomOut() {
  scale.value = Math.max(scale.value - scaleStep, minScale);
}

function resetZoom() {
  scale.value = 1;
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
  if (e.button !== 1) return; // 只响应鼠标中键
  isPanning.value = true;
  startPanPos.value = {
    x: e.clientX - panOffset.value.x,
    y: e.clientY - panOffset.value.y
  };
}

function doPan(e: MouseEvent) {
  if (!isPanning.value) return;
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
  // 只处理直接点击画布的情况
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

function handleDrop(e: DragEvent) {
  e.preventDefault();
  const compType = e.dataTransfer?.getData('component-type');
  if (!compType) return;

  // 获取画布相对位置
  const canvasRect = canvasRef.value?.getBoundingClientRect();
  if (!canvasRect) return;

  // 计算放置位置（考虑缩放和平移）
  const x = (e.clientX - canvasRect.left - panOffset.value.x) / scale.value;
  const y = (e.clientY - canvasRect.top - panOffset.value.y) / scale.value;

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
  cursor: grab;
}

.canvas-wrapper:active {
  cursor: grabbing;
}

.canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  overflow: visible;
  transition: transform 0.2s;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.canvas-content {
  width: 100%;
  height: 100%;
  position: relative;
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
