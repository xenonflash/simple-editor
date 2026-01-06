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
             @mousedown="startPan"
             @mousemove="doPan"
             @mouseup="endPan"
             @mouseleave="endPan">
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
                :components="props.components"
              />

              <!-- 拖动已有组件：600ms 激活容器拖入模式 + 影子预览 -->
              <DropPreviewBox />

              <!-- 从面板拖入新组件：虚拟落地框（保留旧逻辑） -->
              <div v-if="dropIndicator.show" class="drop-indicator" :style="dropIndicatorStyle" />
              
              <!-- 组件渲染 - 提高层级 -->
              <template v-for="(comp, index) in props.components"
                        :key="comp.id">
                  <template v-for="rep in getRenderRepeats(comp, index)" :key="rep.key">
                <div class="component-wrapper"
                     v-show="rep.visible"
                     :style="{ zIndex: rep.zIndex }">
                  <Container v-if="rep.comp.type === 'container'"
                    :id="rep.instanceId"
                    :comp="rep.comp"
                    v-bind="getRenderedProps(rep.comp, rep.bindingContext)"
                    :x="(getRenderedProps(rep.comp, rep.bindingContext).x ?? 0) + rep.offsetX"
                    :y="(getRenderedProps(rep.comp, rep.bindingContext).y ?? 0) + rep.offsetY"
                    :scale="scale"
                    :bindingContext="rep.bindingContext"
                    @contextmenu.prevent="showContextMenu($event, pageStore.getComponentById(rep.instanceId) || rep.comp)"
                    @update="(payload) => handleUpdatePosition(payload.id, payload.updates)" />
                  <Text v-else-if="rep.comp.type === 'text'"
                    :id="rep.instanceId"
                    v-bind="getRenderedProps(rep.comp, rep.bindingContext)"
                    :content="getRenderedProps(rep.comp, rep.bindingContext).content ?? '新建文本'"
                    :x="(getRenderedProps(rep.comp, rep.bindingContext).x ?? 0) + rep.offsetX"
                    :y="(getRenderedProps(rep.comp, rep.bindingContext).y ?? 0) + rep.offsetY"
                    :scale="scale"
                    @contextmenu.prevent="showContextMenu($event, pageStore.getComponentById(rep.instanceId) || rep.comp)"
                    @update="(updates) => handleUpdatePosition(rep.instanceId, updates)" />
                  <Button v-else-if="rep.comp.type === 'button'"
                      :id="rep.instanceId"
                      v-bind="getRenderedProps(rep.comp, rep.bindingContext)"
                      :x="(getRenderedProps(rep.comp, rep.bindingContext).x ?? 0) + rep.offsetX"
                      :y="(getRenderedProps(rep.comp, rep.bindingContext).y ?? 0) + rep.offsetY"
                      :scale="scale"
                      @contextmenu.prevent="showContextMenu($event, pageStore.getComponentById(rep.instanceId) || rep.comp)"
                      @update="(updates) => handleUpdatePosition(rep.instanceId, updates)" />
                  <NaiveWrapper v-else-if="isNaiveComp(rep.comp.type)"
                        :comp="rep.comp"
                        :scale="scale"
                        :bindingContext="rep.bindingContext"
                        @contextmenu.prevent="showContextMenu($event, pageStore.getComponentById(rep.instanceId) || rep.comp)"
                        @update="(updates) => handleUpdatePosition(rep.instanceId, updates)" />
                </div>
                  </template>
              </template>
              
              <!-- 其他组件保持原有层级 -->
              <SnapLines 
              />
              
              <Controls 
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
      v-if="contextMenu.show"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="saveAsCustomComponent">
        <span class="icon">💾</span>
        <span class="text">保存为组件</span>
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
import Container from '../comps/Container.vue';
import Text from '../comps/Text.vue';
import Button from '../comps/Button.vue';
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

import { useMessage } from 'naive-ui'

import NaiveWrapper from '../comps/NaiveWrapper.vue';
import { CompType } from '../../types/component';
import { resolveBindingRef } from '../../utils/bindingRef';
import { instantiateFromCustomComponentTemplate } from '../../utils/customComponentInstance'
import DropPreviewBox from './DropPreviewBox.vue'
import { DROP_PREVIEW_STORE_KEY, useDropPreviewStore, type ContainerHit } from '../../stores/dropPreview'
import { createCoordinateHelper, COORDINATE_HELPER_KEY } from '../../utils/coordinateHelper'
import { usePointerHubStore } from '../../stores/pointerHub'
import { getLoopSourceId } from '../../utils/loopInstance'
import { useBoardContextMenu } from './useBoardContextMenu'
import {
  mergeBindingContext,
  getCustomPropsBindingContext,
  getRenderedProps as getRenderedPropsUtil,
  createBindingResolver,
  getRenderRepeatsForRoot,
  type RenderRepeat
} from '../../utils/renderLoop'
import { useEditorStore } from '../../stores/editor'

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

// 使用公共模块的循环渲染函数
function getRenderRepeats(comp: Comp, index: number): RenderRepeat[] {
  return getRenderRepeatsForRoot(comp, index, props.bindingContext)
}

function getContainerHits(): ContainerHit[] {
  const res: ContainerHit[] = []
  const stack: Comp[] = [...props.components]

  while (stack.length > 0) {
    const c = stack.pop()!
    if (c.children && c.children.length > 0) stack.push(...c.children)
    if (c.type !== 'container') continue

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
  contextMenu,
  showContextMenu,
  hideContextMenu,
  duplicateComponent,
  saveAsCustomComponent,
  bringToFront,
  bringForward,
  sendBackward,
  sendToBack,
  deleteComponentFromMenu
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
}

function handleKeyUp(e: KeyboardEvent) {
  pointerHubStore.handlePanKeyUp(e)
}

// 缩放函数（工具栏按钮用）
function zoomIn() {
  setScale(scale.value + scaleStep)
}

function zoomOut() {
  setScale(scale.value - scaleStep)
}

function resetZoom() {
  setScale(1)
}

function setScale(newScale: number, center?: { x: number; y: number }) {
  const oldScale = scale.value
  newScale = Math.max(minScale, Math.min(maxScale, newScale))
  if (Math.abs(newScale - oldScale) < 0.00001) return

  const zoomCenter = center || viewportCenter.value
  const scaleFactor = newScale / oldScale
  const dx = (zoomCenter.x - panOffset.value.x) * (1 - scaleFactor)
  const dy = (zoomCenter.y - panOffset.value.y) * (1 - scaleFactor)

  scale.value = newScale
  panOffset.value = {
    x: panOffset.value.x + dx,
    y: panOffset.value.y + dy
  }
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
  pointerHubStore.startPan(e)
}

function doPan(e: MouseEvent) {
  pointerHubStore.doPan(e)
}

function endPan() {
  pointerHubStore.endPan()
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
  
  const normalizedId = getLoopSourceId(id)
  const comp = pageStore.getComponentById(normalizedId);
  if (!comp) return;

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

// 处理拖拽
function handleDragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'copy';
  }

  const customComponentId = e.dataTransfer?.getData('customComponentId') || ''
  const componentType = e.dataTransfer?.getData('componentType') as CompType;
  if (!customComponentId && !componentType) {
    dropIndicator.value.show = false;
    dropIndicator.value.containerId = null;
    return;
  }

  const canvasPos = screenToCanvas(e.clientX, e.clientY);
  const hit = findContainerHit(canvasPos.x, canvasPos.y);
  if (hit) {
    dropIndicator.value = {
      show: true,
      containerId: hit.containerId,
      x: hit.x,
      y: hit.y,
      width: hit.width,
      height: hit.height
    };
  } else {
    dropIndicator.value.show = false;
    dropIndicator.value.containerId = null;
  }
}

function handleDragLeave() {
  dropIndicator.value.show = false;
  dropIndicator.value.containerId = null;
}

// 获取下一个可用的zIndex
function getNextZIndex(): number {
  if (props.components.length === 0) return 1;
  const maxZIndex = Math.max(...props.components.map(c => c.props.zIndex || 1));
  return maxZIndex + 1;
}

// 从屏幕坐标转换为画布坐标
function screenToCanvas(screenX: number, screenY: number): { x: number, y: number } {
  const wrapperRect = wrapperRef.value?.getBoundingClientRect();
  if (!wrapperRect) return { x: 0, y: 0 };

  // 计算相对于wrapper的坐标
  const wrapperX = screenX - wrapperRect.left;
  const wrapperY = screenY - wrapperRect.top;
  
  // 转换为画布坐标（考虑缩放和平移）
  return {
    x: (wrapperX - panOffset.value.x) / scale.value,
    y: (wrapperY - panOffset.value.y) / scale.value
  };
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  const customComponentId = e.dataTransfer?.getData('customComponentId') || ''
  const componentType = e.dataTransfer?.getData('componentType') as CompType;
  if (!customComponentId && !componentType) return;

  // 使用统一的坐标转换函数
  const canvasPos = screenToCanvas(e.clientX, e.clientY);

  const hit = findContainerHit(canvasPos.x, canvasPos.y);

  if (customComponentId) {
    const def = customComponentsStore.getById(customComponentId)
    if (!def) return

    const buildDefaultsFromSchema = (schema: any): Record<string, any> => {
      const res: Record<string, any> = {}
      const src = (schema && typeof schema === 'object') ? schema : {}
      for (const [k, s] of Object.entries(src)) {
        const ss: any = s
        if (ss && Object.prototype.hasOwnProperty.call(ss, 'manual')) {
          res[k] = ss.default
          continue
        }
        const t = ss?.type
        if (t === 'number') res[k] = 0
        else if (t === 'boolean') res[k] = false
        else if (t === 'json') res[k] = null
        else res[k] = ''
      }
      return res
    }

    const roots = importFromJSON(def.templateJson)
    const root = roots[0]
    if (!root) return

    // 实例化：为该次拖入生成全新的唯一 id（并修正内部 comp: 绑定引用）
    instantiateFromCustomComponentTemplate(root)

    root.custom = {
      defId: def.id,
      props: buildDefaultsFromSchema((def as any).propsSchema),
      state: buildDefaultsFromSchema((def as any).stateSchema)
    }

    if (hit) {
      const container = pageStore.getComponentById(hit.containerId);
      const layoutMode = (container?.props as any)?.layoutMode || 'manual';
      if (layoutMode === 'manual') {
        root.props.x = canvasPos.x - hit.x;
        root.props.y = canvasPos.y - hit.y;
      } else {
        root.props.x = 0;
        root.props.y = 0;
      }
      root.props.zIndex = 1;
      emit('addToContainer', { containerId: hit.containerId, comp: root });
    } else {
      root.props.x = canvasPos.x;
      root.props.y = canvasPos.y;
      root.props.zIndex = getNextZIndex();
      emit('add', root);
    }

    dropIndicator.value.show = false;
    dropIndicator.value.containerId = null;
    return;
  }
  if (hit) {
    const container = pageStore.getComponentById(hit.containerId);
    const layoutMode = (container?.props as any)?.layoutMode || 'manual';

    const newComp = createComp(componentType, `新建${componentType}`);
    if (layoutMode === 'manual') {
      newComp.props.x = canvasPos.x - hit.x;
      newComp.props.y = canvasPos.y - hit.y;
    } else {
      newComp.props.x = 0;
      newComp.props.y = 0;
    }
    newComp.props.zIndex = 1;

    history.addAction({
      type: ActionType.ADD,
      componentId: newComp.id,
      data: {
        after: newComp,
        parentContainerId: hit.containerId
      } as any
    });

    emit('addToContainer', { containerId: hit.containerId, comp: newComp });
    dropIndicator.value.show = false;
    dropIndicator.value.containerId = null;
    return;
  }

  // 创建新组件
  const newComp = createComp(componentType, `新建${componentType}`);
  newComp.props.x = canvasPos.x;
  newComp.props.y = canvasPos.y;
  newComp.props.zIndex = getNextZIndex(); // 确保新组件有正确的zIndex

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

  dropIndicator.value.show = false;
  dropIndicator.value.containerId = null;
}

const dropIndicator = ref<{ show: boolean; containerId: string | null; x: number; y: number; width: number; height: number }>({
  show: false,
  containerId: null,
  x: 0,
  y: 0,
  width: 0,
  height: 0
});

const dropIndicatorStyle = computed(() => ({
  position: 'absolute',
  left: `${dropIndicator.value.x}px`,
  top: `${dropIndicator.value.y}px`,
  width: `${dropIndicator.value.width}px`,
  height: `${dropIndicator.value.height}px`,
  border: '2px dashed #1890ff',
  background: 'rgba(24, 144, 255, 0.06)',
  pointerEvents: 'none',
  boxSizing: 'border-box'
} as any));

function findContainerHit(canvasX: number, canvasY: number): { containerId: string; x: number; y: number; width: number; height: number } | null {
  const candidates = getContainerHits()
    .map((c) => ({ id: c.id, x: c.rect.x, y: c.rect.y, width: c.rect.width, height: c.rect.height, z: c.zIndex }))
    .filter((r) => canvasX >= r.x && canvasX <= r.x + r.width && canvasY >= r.y && canvasY <= r.y + r.height)
    .sort((a, b) => b.z - a.z)

  const top = candidates[0]
  if (!top) return null
  return { containerId: top.id, x: top.x, y: top.y, width: top.width, height: top.height }
}

// 初始化画布居中
function initializeCanvas() {
  if (!wrapperRef.value) return;
  
  const rect = wrapperRef.value.getBoundingClientRect();
  
  // 使用动态画布尺寸
  const currentCanvasWidth = canvasWidth.value;
  const currentCanvasHeight = canvasHeight.value;
  
  // 计算适合视口的缩放比例，留出边距
  const padding = 80; // 边距
  const availableWidth = rect.width - padding * 2;
  const availableHeight = rect.height - padding * 2;
  
  const scaleX = availableWidth / currentCanvasWidth;
  const scaleY = availableHeight / currentCanvasHeight;
  const fitScale = Math.min(scaleX, scaleY, 1); // 最大不超过100%
  
  // 设置缩放
  scale.value = fitScale;
  
  // 计算缩放后的画布尺寸
  const scaledWidth = currentCanvasWidth * fitScale;
  const scaledHeight = currentCanvasHeight * fitScale;
  
  // 计算居中位置（画布左上角的位置）
  const centerX = (rect.width - scaledWidth) / 2;
  const centerY = (rect.height - scaledHeight) / 2;
  
  // 调试信息
  if (DEBUG) {
    console.log('[Board] Canvas initialization:', {
      wrapperSize: { width: rect.width, height: rect.height },
      canvasSize: { width: currentCanvasWidth, height: currentCanvasHeight },
      scaledSize: { width: scaledWidth, height: scaledHeight },
      scale: fitScale,
      centerPosition: { x: centerX, y: centerY }
    });
  }
  
  panOffset.value = {
    x: centerX,
    y: centerY
  };
}

// 生命周期钩子
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

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
  window.removeEventListener('keyup', handleKeyUp);
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
