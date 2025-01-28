<template>
  <div class="board">
    <div class="toolbar">
      <button @click="zoomIn">放大</button>
      <button @click="zoomOut">缩小</button>
      <button @click="resetZoom">重置</button>
      <span>{{ Math.round(scale * 100) }}%</span>
    </div>
    <div class="main-content">
      <div class="canvas-container">
        <div class="ruler-corner"></div>
        <Ruler type="horizontal" 
               :scale="scale" 
               :offset="panOffset" />
        <Ruler type="vertical" 
               :scale="scale" 
               :offset="panOffset" />
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
              <template v-for="comp in props.components"
                        :key="comp.id">
                <Container v-if="comp.type === 'container'"
                          v-bind="comp.props"
                          :scale="scale"
                          :selected="selectedId === comp.id"
                          @select="handleSelect(comp.id)"
                          @update="(updates) => handleUpdatePosition(comp.id, updates)" />
                <Text v-else-if="comp.type === 'text'"
                      v-bind="comp.props"
                      :scale="scale"
                      :selected="selectedId === comp.id"
                      @select="handleSelect(comp.id)"
                      @update="(updates) => handleUpdatePosition(comp.id, updates)" />
              </template>
              <div class="placeholder" v-if="props.components.length === 0">
                拖拽组件到此处开始设计
              </div>
            </div>
          </div>
        </div>
      </div>
      <PropertiesPanel 
        :component="selectedComponent"
        @update="handleComponentUpdate" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import Container from '../comps/Container.vue';
import Text from '../comps/Text.vue';
import Ruler from './Ruler.vue';
import PropertiesPanel from './PropertiesPanel.vue';
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

// 缓存视口中心点计算
const viewportCenter = computed(() => {
  const rect = wrapperRef.value?.getBoundingClientRect();
  return rect ? {
    x: rect.width / 2,
    y: rect.height / 2
  } : { x: 0, y: 0 };
});

// 视口中心点
const panState = reactive({
  isPanning: false,
  lastX: 0,
  lastY: 0,
  spaceKeyPressed: false
});

// 画布偏移
const panOffset = ref({ x: 0, y: 0 });

// 处理空格键
function handleKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' && !e.repeat && !panState.spaceKeyPressed) {
    panState.spaceKeyPressed = true;
    document.body.style.cursor = 'grab';
  }
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') {
    panState.spaceKeyPressed = false;
    document.body.style.cursor = '';
  }
}

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
  
  const rect = wrapperRef.value?.getBoundingClientRect();
  if (!rect) return;
  
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // 检测是否是缩放手势（触控板双指捏合或 Command + 滚轮）
  if (e.ctrlKey || e.metaKey) {
    const delta = -e.deltaY;
    const zoomFactor = Math.pow(1.01, delta);
    
    // 限制缩放范围
    const newScale = Math.max(0.1, Math.min(3, scale.value * zoomFactor));
    if (newScale !== scale.value) {
      const scaleFactor = newScale / scale.value;
      
      // 计算新的偏移，保持鼠标位置不变
      panOffset.value = {
        x: panOffset.value.x + (mouseX - panOffset.value.x) * (1 - scaleFactor),
        y: panOffset.value.y + (mouseY - panOffset.value.y) * (1 - scaleFactor)
      };
      
      scale.value = newScale;
    }
    return;
  }

  // 处理平移，考虑设备像素比
  const pixelRatio = window.devicePixelRatio || 1;
  panOffset.value = {
    x: panOffset.value.x - e.deltaX / pixelRatio,
    y: panOffset.value.y - e.deltaY / pixelRatio
  };
}

// 优化平移处理
function startPan(e: MouseEvent) {
  if (e.button === 1 || (e.button === 0 && panState.spaceKeyPressed)) {
    panState.isPanning = true;
    panState.lastX = e.clientX;
    panState.lastY = e.clientY;
    document.body.style.cursor = 'grabbing';
  }
}

function doPan(e: MouseEvent) {
  if (!panState.isPanning) return;

  const dx = e.clientX - panState.lastX;
  const dy = e.clientY - panState.lastY;

  panOffset.value = {
    x: panOffset.value.x + dx,
    y: panOffset.value.y + dy
  };

  panState.lastX = e.clientX;
  panState.lastY = e.clientY;
}

function endPan() {
  if (panState.isPanning) {
    panState.isPanning = false;
    document.body.style.cursor = panState.spaceKeyPressed ? 'grab' : '';
  }
}

// 画布样式
const canvasStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: '0 0',
}));

const contentStyle = computed(() => ({
  transform: `translate(${panOffset.value.x}px, ${panOffset.value.y}px)`,
}));

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
  const componentType = e.dataTransfer?.getData('componentType') as CompType;
  if (!componentType) return;

  // 获取相对于画布的放置位置
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;

  // 计算放置位置（考虑缩放和平移）
  const dropX = (e.clientX - rect.left - panOffset.value.x) / scale.value;
  const dropY = (e.clientY - rect.top - panOffset.value.y) / scale.value;

  // 创建新组件
  const newComp = createComp(componentType, `新建${componentType}`);
  newComp.props.x = dropX;
  newComp.props.y = dropY;

  // 发出添加组件事件
  emit('add', newComp);
}

// 生命周期钩子
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
});

// 选中的组件
const selectedComponent = computed(() => {
  if (!props.selectedId) return null;
  return props.components.find(comp => comp.id === props.selectedId) || null;
});

// 处理组件更新
function handleComponentUpdate(updates: any) {
  if (!props.selectedId) return;
  
  const comp = props.components.find(comp => comp.id === props.selectedId);
  if (!comp) return;
  
  emit('update', {
    ...comp,
    ...updates
  });
}
</script>

<style scoped>
.board {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f0f2f5;
}

.toolbar {
  height: 40px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #e5e5e5;
  background: white;
  user-select: none;
}

.toolbar button {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar button:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-container {
  flex: 1;
  position: relative;
  display: grid;
  grid-template: 24px 1fr / 24px 1fr;
  overflow: hidden;
  background: white;
}

.ruler-corner {
  width: 24px;
  height: 24px;
  background: white;
  border-right: 1px solid #e5e5e5;
  border-bottom: 1px solid #e5e5e5;
  z-index: 2;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  cursor: default;
  grid-row: 2;
  grid-column: 2;
  background: #f5f5f5;
}

.canvas-wrapper.is-panning {
  cursor: grab;
}

.canvas {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
}

.canvas-content {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 3000px;
  min-height: 3000px;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: center center;
}

.placeholder {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-size: 14px;
  pointer-events: none;
  user-select: none;
}
</style>
