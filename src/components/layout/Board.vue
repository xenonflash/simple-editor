<template>
  <div class="board">
    <div class="main-content">
      <div class="canvas-container">
        <Ruler type="horizontal" 
               :scale="scale" 
               :offset="panOffset" />
        <Ruler type="vertical" 
               :scale="scale" 
               :offset="panOffset" />
        <div class="canvas-wrapper" 
             ref="wrapperRef"
             @wheel="handleWheel"
             @mousedown="pointerHubStore.startPan"
             @mousemove="pointerHubStore.doPan"
             @mouseup="pointerHubStore.endPan"
             @mouseleave="pointerHubStore.endPan">
          <div class="canvas"
               :style="canvasStyle" 
               ref="canvasRef"
               @dragover="handleDragOver"
               @drop="handleDrop"
               @dragleave="handleDragLeave"
               @mousedown.stop="handleCanvasClick">
            <div class="canvas-content"
                 :style="contentStyle">
              <!-- 多选组件 - 放在底层但能接收事件 -->
              <MultiSelect 
                v-if="editorStore.isDesignMode"
                :components="props.components"
              />

              <!-- 拖动已有组件：600ms 激活容器拖入模式 + 影子预览 -->
              <DropPreviewBox v-if="editorStore.isDesignMode" />

              <!-- 从面板拖入新组件：虚拟落地框（保留旧逻辑） -->
              <div v-if="dropIndicator.show && editorStore.isDesignMode" class="drop-indicator" :style="dropIndicatorStyle" />
              
              <!-- 组件渲染 - 提高层级 -->
              <template v-for="(comp) in props.components"
                        :key="comp.id">
                <div class="component-wrapper"
                     v-show="comp.props.renderVisible !== false"
                     :style="{ zIndex: comp.props.zIndex || 1 }">
                  <ComponentRenderer
                    :comp="comp"
                    :instanceId="comp.id"
                    :bindingContext="{}"
                    :scale="scale"
                    :offsetX="0"
                    :offsetY="0"
                    @contextmenu.prevent="showContextMenu($event, comp)"
                    @update="(payload) => handleUpdatePosition(payload.id, payload.updates)"
                  />
                </div>
              </template>
              
              <!-- 其他组件保持原有层级 -->
              <SnapLines v-if="editorStore.isDesignMode" />
              
              <Controls v-if="editorStore.isDesignMode"
                @update="handleUpdatePosition"
              />
              
              <div class="placeholder" v-if="props.components.length === 0">
                拖拽组件到此处开始设计
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 新的悬浮工具栏 -->
    <BoardToolbar
      :scale="scale"
      :onZoomOut="zoomOut"
      :onZoomIn="zoomIn"
      :onResetZoom="resetZoom"
    />
    
    <!-- 右键菜单 -->
    <div 
      v-if="contextMenu.show && editorStore.isDesignMode"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="saveAsCustomComponent">
        <span class="icon">💾</span>
        <span class="text">保存为组件</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="groupComponents">
        <span class="icon">📦</span>
        <span class="text">组合 (Shift+A)</span>
      </div>
      <div class="menu-item" @click="ungroupComponents">
        <span class="icon">📤</span>
        <span class="text">取消组合 (Shift+S)</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="duplicateComponent">
        <span class="icon">📋</span>
        <span class="text">复制</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="bringToFront">
        <span class="icon">⬆</span>
        <span class="text">置于顶层</span>
      </div>
      <div class="menu-item" @click="bringForward">
        <span class="icon">↑</span>
        <span class="text">上移一层</span>
      </div>
      <div class="menu-item" @click="sendBackward">
        <span class="icon">↓</span>
        <span class="text">下移一层</span>
      </div>
      <div class="menu-item" @click="sendToBack">
        <span class="icon">⬇</span>
        <span class="text">置于底层</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item danger" @click="deleteComponentFromMenu">
        <AppIcon name="trash" />
        <span class="text">删除</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted, watch, nextTick, provide } from 'vue';
import { storeToRefs } from 'pinia'
import ComponentRenderer from '../comps/ComponentRenderer.vue';
import Ruler from './Ruler.vue';
import SnapLines from './SnapLines.vue';
import Controls from './Controls.vue';
import MultiSelect from './MultiSelect.vue';
import type { Comp } from '../comps/base';
import { createComp } from '../comps/base';
import { history, ActionType } from '../../utils/history';
import { importFromJSON } from '../../utils/io';

import BoardToolbar from './BoardToolbar.vue';
import { useSnaplineStore } from '../../stores/snapline';
import { usePageStore } from '../../stores/page';
import { useCustomComponentsStore } from '../../stores/customComponents'
import { useEditorStore } from '../../stores/editor'

import { useMessage } from 'naive-ui'

import { CompType } from '../../types/component';
import { resolveBindingRef } from '../../utils/bindingRef';
import { instantiateFromCustomComponentTemplate } from '../../utils/customComponentInstance'
import DropPreviewBox from './DropPreviewBox.vue'
import { DROP_PREVIEW_STORE_KEY, useDropPreviewStore, type ContainerHit } from '../../stores/dropPreview'
import { createCoordinateHelper, COORDINATE_HELPER_KEY } from '../../utils/coordinateHelper'
import { usePointerHubStore } from '../../stores/pointerHub'
import { useBoardContextMenu } from './useBoardContextMenu'
import { useBoardZoom } from './useBoardZoom'
import { useBoardDragDrop } from './useBoardDragDrop'
import {
  mergeBindingContext,
  getCustomPropsBindingContext,
  getRenderedProps as getRenderedPropsUtil,
  createBindingResolver,
  type RenderRepeat
} from '../../utils/renderLoop'
import { getLoopSourceId, parseLoopInstanceId } from '../../utils/loopInstance'
// 引用
const wrapperRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null);

const props = defineProps<{
  components: Comp[];
  bindingContext?: any;
}>();

const emit = defineEmits<{
  (e: 'select', id: string | null): void;
  (e: 'update', compOrComps: Comp | Comp[]): void;
  (e: 'add', comp: Comp): void;
  (e: 'addToContainer', payload: { containerId: string; comp: Comp }): void;
  (e: 'delete', id: string): void;
}>();

// 调试模式
const DEBUG = true;
function log(...args: any[]) {
  if (DEBUG) console.log('[Board]', ...args);
}

const snaplineStore = useSnaplineStore();
const pageStore = usePageStore();
const customComponentsStore = useCustomComponentsStore()
const pointerHubStore = usePointerHubStore()
const editorStore = useEditorStore()
const message = useMessage()

// 使用公共模块的工具函数，创建本地包装器以保持向后兼容
function getBindingContextForRoot(comp: Comp): any {
  const baseContext = props.bindingContext
  const resolver = createBindingResolver(baseContext)
  const customCtx = getCustomPropsBindingContext(comp, baseContext, resolver)
  return mergeBindingContext(baseContext, customCtx)
}

function getRenderedProps(comp: Comp, context?: any): Record<string, any> {
  const ctx = context ?? getBindingContextForRoot(comp)
  const resolver = createBindingResolver(ctx)
  return getRenderedPropsUtil(comp, ctx, resolver)
}

function getContainerHits(): ContainerHit[] {
  const res: ContainerHit[] = []
  const stack: Comp[] = [...props.components]

  while (stack.length > 0) {
    const c = stack.pop()!
    if (c.children && c.children.length > 0) stack.push(...c.children)
    if (c.type !== 'container' && c.type !== 'list') continue

    const p: any = c.id ? pageStore.getComponentById(c.id)?.props ?? c.props : c.props

    const pos = pageStore.getComponentCanvasPosition(c.id)
    const x = pos?.x ?? (Number(p?.x) || 0)
    const y = pos?.y ?? (Number(p?.y) || 0)

    const measuredW = Number((p as any)?._measuredWidth)
    const measuredH = Number((p as any)?._measuredHeight)

    const widthSizing = (p as any)?.widthSizing as string | undefined
    const heightSizing = (p as any)?.heightSizing as string | undefined

    const rawW = typeof p?.width === 'number' ? p.width : Number(p?.width)
    const rawH = typeof p?.height === 'number' ? p.height : Number(p?.height)

    const width = (widthSizing && widthSizing !== 'fixed' && Number.isFinite(measuredW))
      ? measuredW
      : (Number.isFinite(rawW) ? rawW : (Number.isFinite(measuredW) ? measuredW : 100))

    const height = (heightSizing && heightSizing !== 'fixed' && Number.isFinite(measuredH))
      ? measuredH
      : (Number.isFinite(rawH) ? rawH : (Number.isFinite(measuredH) ? measuredH : 100))

    res.push({
      id: c.id,
      rect: { x, y, width, height },
      zIndex: p?.zIndex || 1,
      layoutMode: (p?.layoutMode || 'manual') as any,
      paddingTop: p?.paddingTop || 0,
      paddingRight: p?.paddingRight || 0,
      paddingBottom: p?.paddingBottom || 0,
      paddingLeft: p?.paddingLeft || 0
    })
  }

  return res
}

function flattenComponents(list: Comp[]): Comp[] {
  const out: Comp[] = []
  const stack: Comp[] = [...list]
  while (stack.length > 0) {
    const c = stack.pop()!
    out.push(c)
    if (c.children && c.children.length > 0) stack.push(...c.children)
  }
  return out
}

// 使用页面的动态尺寸
const canvasWidth = computed(() => pageStore.currentPage?.width || 1280);
const canvasHeight = computed(() => pageStore.currentPage?.height || 800);

// 缩放相关
const scale = ref(1);

// pan 状态收口到 pointerHub store（注意：Pinia 会自动解包 ref，需要 storeToRefs 保留 Ref<Point>）
const { panOffset } = storeToRefs(pointerHubStore)

function isNaiveComp(type: CompType) {
  return type.startsWith('n-');
}

const coord = createCoordinateHelper({
  wrapperRef,
  scale,
  panOffset
})

provide(COORDINATE_HELPER_KEY, coord)

const dropPreviewStore = useDropPreviewStore({
  coord,
  pointerHub: pointerHubStore,
  getContainers: getContainerHits,
  canDragIntoContainer: (componentId) => pageStore.getComponentById(componentId)?.type !== 'container',
  hoverActivateMs: 400,
  onMoveToContainer: (payload) => {
    const ok = pageStore.moveComponentToContainer(payload.componentId, payload.containerId, {
      layoutMode: payload.layoutMode,
      localX: payload.localX,
      localY: payload.localY
    })
    if (ok) pageStore.selectComponent(payload.componentId)
  }
})

provide(DROP_PREVIEW_STORE_KEY, dropPreviewStore)

const { 
  zoomIn, 
  zoomOut, 
  resetZoom, 
  handleWheel, 
  initializeCanvas 
} = useBoardZoom({
  wrapperRef,
  canvasWidth,
  canvasHeight,
  scale,
  coord
})

const {
  dropIndicator,
  dropIndicatorStyle,
  handleDragOver,
  handleDragLeave,
  handleDrop: _handleDrop
} = useBoardDragDrop({
  components: props.components,
  coord,
  getContainerHits
})

const handleDrop = (e: DragEvent) => _handleDrop(e, emit)

const {
  contextMenu,
  showContextMenu,
  hideContextMenu,
  duplicateComponent,
  saveAsCustomComponent,
  bringToFront,
  bringForward,
  sendBackward,
  sendToBack,
  deleteComponentFromMenu,
  groupComponents,
  ungroupComponents
} = useBoardContextMenu({
  pageStore,
  customComponentsStore,
  message
})

// 监听组件变化，更新 store
watch(() => props.components, (newComponents) => {
  snaplineStore.updateAllComponents(flattenComponents(newComponents));
}, { immediate: true, deep: true });

// 同步画布尺寸到吸附系统（避免 snapline 仍使用硬编码尺寸）
watch(
  [canvasWidth, canvasHeight],
  ([w, h]) => {
    snaplineStore.updateCanvasSize({ width: w, height: h })
  },
  { immediate: true }
)

// 监听页面尺寸变化，重新初始化画布
watch([canvasWidth, canvasHeight], () => {
  nextTick(() => {
    initializeCanvas();
  });
});

// 处理空格键
function handleKeyDown(e: KeyboardEvent) {
  // 如果正在输入框中输入，不触发快捷键
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && (
    activeElement.tagName === 'INPUT' || 
    activeElement.tagName === 'TEXTAREA' || 
    activeElement.isContentEditable
  )) {
    return;
  }

  // pan(space+drag) 收口到 pointerHub
  pointerHubStore.handlePanKeyDown(e)
  if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
    if (e.shiftKey) {
      pageStore.redoHistoryAction();
    } else {
      pageStore.undoHistoryAction();
    }
    e.preventDefault();
  }
  // 修复：支持多选删除
  if ((e.key === 'Delete' || e.key === 'Backspace') && pageStore.selectedComps.length > 0) {
    const res = pageStore.deleteSelectedComponents()
    if (res.blockedCount > 0) {
      message.warning('组件编辑模式下不允许删除最外层容器')
    }
    e.preventDefault();
  }
  // 组合组件 (Shift+A)
  if (e.shiftKey && (e.key === 'a' || e.key === 'A') && pageStore.selectedComps.length >= 2) {
    groupComponents()
    e.preventDefault();
  }
  // 取消组合 (Shift+S)
  if (e.shiftKey && (e.key === 's' || e.key === 'S') && pageStore.selectedComps.length === 1) {
    ungroupComponents()
    e.preventDefault();
  }
}



// 画布样式
const canvasStyle = computed(() => ({
  transform: `scale3d(${scale.value}, ${scale.value}, 1)`,
  transformOrigin: '0 0',
  position: 'absolute' as const,
  left: `${panOffset.value.x}px`,
  top: `${panOffset.value.y}px`,
  width: `${canvasWidth.value}px`,
  height: `${canvasHeight.value}px`,
  background: pageStore.currentPage?.backgroundColor || 'white',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
}));

const contentStyle = computed(() => ({
  transform: `translate(0, 0)`,
}));

// 处理画布点击
function handleCanvasClick(e: MouseEvent) {
  // 预览模式下不处理选中
  if (editorStore.isPreviewMode) return
  
  // MultiSelect 组件会处理框选逻辑
  // 这里只处理简单的取消选中
  const targetEl = e.target as HTMLElement
  if (
    e.target === e.currentTarget ||
    targetEl.classList.contains('canvas-content') ||
    targetEl.classList.contains('component-wrapper')
  ) {
    if (!e.ctrlKey && !e.metaKey) {
      pageStore.selectComponent(null);
    }
  }
}

// 处理组件位置更新
function handleUpdatePosition(id: string, updates: Record<string, any>) {
  // 预览模式下不处理更新
  if (editorStore.isPreviewMode) return
  
  const parsed = parseLoopInstanceId(id)
  const normalizedId = parsed.sourceId
  const comp = pageStore.getComponentById(normalizedId);
  if (!comp) return;

  // 如果是循环实例，将更新存储到 loopOverrides 中，而不是源组件属性
  if (parsed.index !== null && parsed.index > 0) {
    const raw: any = comp.props || {}
    const currentOverrides = raw.loopOverrides || {}
    const indexStr = String(parsed.index)
    
    // 获取之前的覆盖值或默认计算值
    // 注意：这里我们只保存 difference? 不，保存绝对值最简单。
    // 但是，getRenderRepeats 计算出的 currentVal 是 默认值(source + offset) 或 覆盖值。
    // updates 包含的是 new value。
    // 所以直接保存 new value 即可。
    
    const nextOverrides = {
      ...currentOverrides,
      [indexStr]: {
        ...(currentOverrides[indexStr] || {}),
        ...updates
      }
    }
    
    pageStore.updateComponentInCurrentPage({
      ...comp,
      props: {
        ...raw,
        loopOverrides: nextOverrides
      }
    })
    return
  }

  const oldProps = { ...comp.props };
  const newProps = { ...oldProps, ...updates };

  // 记录更新操作
  history.addAction({
    type: ActionType.UPDATE,
    componentId: normalizedId,
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

// 生命周期钩子
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', pointerHubStore.handlePanKeyUp);

  nextTick(() => {
    pointerHubStore.attach({
      coord,
      stageEl: wrapperRef.value
    })
  })
  

  
  // 等待DOM渲染完成后初始化画布位置
  setTimeout(() => {
    initializeCanvas();
  }, 0);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', pointerHubStore.handlePanKeyUp);
  pointerHubStore.detach()
});


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
  transform-origin: 0 0;
  border-radius: 4px;
  overflow: hidden;
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

/* 组件包装器 */
.component-wrapper {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.component-wrapper > * {
  pointer-events: auto;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  min-width: 140px;
  overflow: hidden;
  user-select: none;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item.danger {
  color: #ff4d4f;
}

.menu-item.danger:hover {
  background: #fff1f0;
}

.menu-item .icon {
  font-size: 14px;
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-item .text {
  flex: 1;
}

.menu-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 4px 0;
}
</style>
