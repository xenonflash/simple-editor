<template>
  <div class="board">
    <div class="toolbar">
      <div class="button-group">
        <button @click="undo" :disabled="!canUndo" data-tooltip="撤销 (⌘Z)">
          <span class="icon">↩</span>
          <span class="text">撤销</span>
        </button>
        <button @click="redo" :disabled="!canRedo" data-tooltip="重做 (⌘⇧Z)">
          <span class="icon">↪</span>
          <span class="text">重做</span>
        </button>
      </div>

      <div class="divider"></div>

      <div class="zoom-controls">
        <button @click="zoomOut" data-tooltip="缩小 (⌘-)">
          <span class="icon">－</span>
        </button>
        <span class="zoom-value">{{ Math.round(scale * 100) }}%</span>
        <button @click="zoomIn" data-tooltip="放大 (⌘+)">
          <span class="icon">＋</span>
        </button>
        <button @click="resetZoom" data-tooltip="重置缩放 (⌘0)">
          <span class="icon">↺</span>
        </button>
      </div>

      <div class="divider"></div>

      <button class="delete-button" 
              @click="deleteSelectedComponent" 
              :disabled="!selectedId"
              data-tooltip="删除 (Delete)">
        <span class="icon">🗑</span>
        <span class="text">删除</span>
      </button>

      <div class="divider"></div>

      <div class="button-group">
        <button @click="handleExport" data-tooltip="导出到JSON">
          <span class="icon">⬇</span>
          <span class="text">导出</span>
        </button>
        <button @click="handleImport" data-tooltip="从JSON导入">
          <span class="icon">⬆</span>
          <span class="text">导入</span>
        </button>
      </div>

      <!-- 隐藏的文件输入框 -->
      <input
        type="file"
        ref="fileInput"
        accept=".json"
        style="display: none"
        @change="handleFileSelect"
      />
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
                          :id="comp.id"
                          v-bind="comp.props"
                          :scale="scale"
                          :selected="selectedId === comp.id"
                          @select="handleSelect(comp.id)"
                          @update="(updates) => handleUpdatePosition(comp.id, updates)" />
                <Text v-else-if="comp.type === 'text'"
                      :id="comp.id"
                      v-bind="comp.props"
                      :scale="scale"
                      :selected="props.selectedId === comp.id"
                      @select="handleSelect(comp.id)"
                      @update="(updates) => handleUpdatePosition(comp.id, updates)" />
                <Button v-else-if="comp.type === 'button'"
                      :id="comp.id"
                      v-bind="comp.props"
                      :scale="scale"
                      :selected="props.selectedId === comp.id"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import Container from '../comps/Container.vue';
import Text from '../comps/Text.vue';
import Button from '../comps/Button.vue';
import Ruler from './Ruler.vue';
import type { Comp } from '../comps/base';
import { CompType, createComp } from '../comps/base';
import { history, ActionType } from '../../utils/history';
import { exportToJSON, importFromJSON, downloadJSON, readJSONFile } from '../../utils/io';

// 引用
const wrapperRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const props = defineProps<{
  components: Comp[];
  selectedId?: string | null;
}>();

const emit = defineEmits<{
  (e: 'select', id: string | null): void;
  (e: 'update', compOrComps: Comp | Comp[]): void;
  (e: 'add', comp: Comp): void;
  (e: 'delete', id: string): void;
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
  if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
    if (e.shiftKey) {
      redo();
    } else {
      undo();
    }
    e.preventDefault();
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && props.selectedId) {
    deleteSelectedComponent();
    e.preventDefault();
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
  transform: `scale3d(${scale.value}, ${scale.value}, 1)`,
  transformOrigin: '0 0',
  position: 'absolute' as const,
  left: `${panOffset.value.x}px`,
  top: `${panOffset.value.y}px`,
  width: '100%',
  height: '100%'
}));

const contentStyle = computed(() => ({
  transform: `translate(0, 0)`,
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

  const oldProps = { ...comp.props };
  const newProps = { ...oldProps, ...updates };

  // 记录更新操作
  history.addAction({
    type: ActionType.UPDATE,
    componentId: id,
    data: {
      before: { props: oldProps },
      after: { props: newProps }
    }
  });

  // 更新组件
  const updatedComp = {
    ...comp,
    props: newProps
  };
  emit('update', updatedComp);
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

  // 记录添加操作
  history.addAction({
    type: ActionType.ADD,
    componentId: newComp.id,
    data: {
      after: newComp
    }
  });
  
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

// 撤销重做状态
const canUndo = computed(() => history.canUndo());
const canRedo = computed(() => history.canRedo());

// 删除选中的组件
function deleteSelectedComponent() {
  const comp = props.components.find(comp => comp.id === props.selectedId);
  if (comp) {
    // 记录删除操作
    history.addAction({
      type: ActionType.DELETE,
      componentId: comp.id,
      data: {
        before: comp
      }
    });
    
    // 发出删除事件
    emit('delete', comp.id);
  }
}

// 撤销
function undo() {
  const action = history.undo();
  if (action) {
    switch (action.type) {
      case ActionType.ADD:
        emit('delete', action.componentId);
        break;
      case ActionType.DELETE:
        if (action.data.before) {
          emit('add', action.data.before as Comp);
        }
        break;
      case ActionType.UPDATE:
        const comp = props.components.find(comp => comp.id === action.componentId);
        if (comp && action.data.before) {
          emit('update', {
            ...comp,
            ...action.data.before
          });
        }
        break;
    }
  }
}

// 重做
function redo() {
  const action = history.redo();
  if (action) {
    switch (action.type) {
      case ActionType.ADD:
        if (action.data.after) {
          emit('add', action.data.after as Comp);
        }
        break;
      case ActionType.DELETE:
        emit('delete', action.componentId);
        break;
      case ActionType.UPDATE:
        const comp = props.components.find(comp => comp.id === action.componentId);
        if (comp && action.data.after) {
          emit('update', {
            ...comp,
            ...action.data.after
          });
        }
        break;
    }
  }
}

// 导出功能
function handleExport() {
  try {
    const jsonStr = exportToJSON(props.components);
    const filename = `layout_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.json`;
    downloadJSON(jsonStr, filename);
  } catch (error) {
    console.error('导出失败:', error);
    // 这里可以添加错误提示UI
  }
}

// 导入功能
function handleImport() {
  fileInput.value?.click();
}

// 处理文件选择
async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const jsonStr = await readJSONFile(file);
    const components = importFromJSON(jsonStr);
    
    // 记录导入操作 - 这里不记录历史，因为导入是一个完整的替换操作
    // 如果需要撤销导入，可以考虑添加专门的导入操作类型

    // 更新组件列表
    emit('update', components);
    
    // 清除文件选择
    input.value = '';
  } catch (error) {
    console.error('导入失败:', error);
    // 这里可以添加错误提示UI
  }
}
</script>

<style scoped>
.board {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f0f0f0;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
}

.toolbar {
  height: 40px;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  user-select: none;
}

.toolbar button {
  height: 28px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #1f1f1f;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar button:hover:not(:disabled) {
  background: #f5f5f5;
}

.toolbar button:active:not(:disabled) {
  background: #ebebeb;
  transform: scale(0.98);
}

.toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar button .icon {
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: #666;
}

.toolbar .divider {
  width: 1px;
  height: 24px;
  background: #e5e5e5;
  margin: 0 4px;
}

.toolbar span {
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  padding: 0 8px;
}

/* 工具栏按钮组 */
.toolbar .button-group {
  display: flex;
  gap: 4px;
}

/* 缩放控制组 */
.toolbar .zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar .zoom-value {
  min-width: 45px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

/* 删除按钮特殊样式 */
.toolbar button.delete-button {
  color: #ff4d4f;
}

.toolbar button.delete-button:hover:not(:disabled) {
  background: #fff1f0;
  border-color: #ffa39e;
}

.toolbar button.delete-button:active:not(:disabled) {
  background: #ffccc7;
}

/* 工具提示 */
.toolbar button {
  position: relative;
}

.toolbar button::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%) scale(0.8);
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  font-size: 12px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
}

.toolbar button:hover::after {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) scale(1);
}

.main-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.canvas-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.canvas-wrapper {
  position: absolute;
  inset: 40px 0 0 40px;
  overflow: hidden;
  cursor: grab;
}

.canvas-wrapper:active {
  cursor: grabbing;
}

.canvas {
  position: absolute;
  inset: 0;
  background: white;
  transform-origin: 0 0;
}

.canvas-content {
  position: relative;
  min-width: 100%;
  min-height: 100%;
}

.placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 14px;
  pointer-events: none;
}

/* 标尺角落 */
.ruler-corner {
  position: absolute;
  top: 0;
  left: 0;
  width: 40px;
  height: 40px;
  background: #f5f5f5;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  z-index: 2;
}
</style>
