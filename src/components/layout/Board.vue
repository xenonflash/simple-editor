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
                  <template v-for="rep in getRenderRepeatsForRoot(comp, index)" :key="rep.key">
                <div class="component-wrapper"
                     v-show="rep.visible"
                     :style="{ zIndex: rep.zIndex }">
                  <Container v-if="comp.type === 'container'"
                    :id="comp.id"
                    :comp="comp"
                    v-bind="getRenderedProps(comp)"
                    :scale="scale"
                    :bindingContext="rep.bindingContext"
                    @contextmenu.prevent="showContextMenu($event, comp)"
                    @update="(payload) => handleUpdatePosition(payload.id, payload.updates)" />
                  <Text v-else-if="comp.type === 'text'"
                    :id="comp.id"
                    :content="getRenderedProps(comp).content || '新建文本'"
                    :x="getRenderedProps(comp).x || 0"
                    :y="getRenderedProps(comp).y || 0"
                    v-bind="getRenderedProps(comp)"
                    :scale="scale"
                    @contextmenu.prevent="showContextMenu($event, comp)"
                    @update="(updates) => handleUpdatePosition(comp.id, updates)" />
                  <Button v-else-if="comp.type === 'button'"
                      :id="comp.id"
                      :x="getRenderedProps(comp).x || 0"
                      :y="getRenderedProps(comp).y || 0"
                      v-bind="getRenderedProps(comp)"
                      :scale="scale"
                      @contextmenu.prevent="showContextMenu($event, comp)"
                      @update="(updates) => handleUpdatePosition(comp.id, updates)" />
                  <NaiveWrapper v-else-if="isNaiveComp(comp.type)"
                        :comp="comp"
                        :scale="scale"
                        :bindingContext="rep.bindingContext"
                        @contextmenu.prevent="showContextMenu($event, comp)"
                        @update="(updates) => handleUpdatePosition(comp.id, updates)" />
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
      :canUndo="canUndo"
      :canRedo="canRedo"
      :scale="scale"
      :selected="hasSelection"
      @undo="undo"
      @redo="redo"
      @zoomOut="zoomOut"
      @zoomIn="zoomIn"
      @resetZoom="resetZoom"
      @delete="deleteSelectedComponent"
      @bringToFront="bringSelectedToFront"
      @bringForward="bringSelectedForward"
      @sendBackward="sendSelectedBackward"
      @sendToBack="sendSelectedToBack"
      @export="handleExport"
      @import="handleImport"
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
import { exportToJSON, importFromJSON, downloadJSON, readJSONFile } from '../../utils/io';

import BoardToolbar from './BoardToolbar.vue';
import { useSnaplineStore } from '../../stores/snapline';
import { usePageStore } from '../../stores/page';
import { useCustomComponentsStore } from '../../stores/customComponents'

import { useMessage } from 'naive-ui'

import NaiveWrapper from '../comps/NaiveWrapper.vue';
import { CompType } from '../../types/component';
import { resolveBindingRef } from '../../utils/bindingRef';
import DropPreviewBox from './DropPreviewBox.vue'
import { DROP_PREVIEW_STORE_KEY, useDropPreviewStore, type ContainerHit } from '../../stores/dropPreview'
import { createCoordinateHelper, COORDINATE_HELPER_KEY } from '../../utils/coordinateHelper'
import { usePointerHubStore } from '../../stores/pointerHub'

// 引用
const wrapperRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

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
const message = useMessage()

function isProtectedRootContainerInCustomEdit(comp: Comp): boolean {
  if (pageStore.editorMode !== 'custom-edit') return false
  if (!comp || comp.type !== 'container') return false
  const parentId = pageStore.findParentContainerId(comp.id)
  return parentId === null
}

function mergeBindingContext(base: any, extra: any): any {
  if (!extra) return base
  if (!base) return extra
  return { ...base, ...extra }
}

function getCustomPropsBindingContext(comp: Comp): any {
  const p: any = comp?.props || {}
  const customProps = p.__customProps
  if (customProps && typeof customProps === 'object') {
    return { customProps, props: customProps }
  }
  return undefined
}

const renderedPropsMap = computed(() => {
  const map = new Map<string, Record<string, any>>();
  const variables = pageStore.currentPage?.variables || [];
  const components = pageStore.currentPage?.components || [];

  function resolveBinding(bindingRef: string, context?: any): any {
    return resolveBindingRef(bindingRef, {
      getVarValue: (name) => pageStore.getVariableValue(name),
      getCompProp: (componentId, propKey) => pageStore.getComponentById(componentId)?.props?.[propKey],
      context
    })
  }

  for (const comp of props.components) {
    const raw = { ...(comp.props || {}) };
    const context = mergeBindingContext(props.bindingContext, getCustomPropsBindingContext(comp))
    if (comp.bindings) {
      for (const [propName, bindingRef] of Object.entries(comp.bindings)) {
        if (typeof bindingRef !== 'string') continue;
        raw[propName] = resolveBinding(bindingRef, context);
      }
    }
    map.set(comp.id, raw);
  }

  return map;
});

function getRenderedProps(comp: Comp): Record<string, any> {
  return renderedPropsMap.value.get(comp.id) || comp.props || {};
}

function getBindingContextForRoot(comp: Comp): any {
  return mergeBindingContext(props.bindingContext, getCustomPropsBindingContext(comp))
}

function isVisibleByRenderControl(comp: Comp): boolean {
  const raw: any = getRenderedProps(comp)
  // 默认显示；绑定返回 false 则隐藏
  if (raw && Object.prototype.hasOwnProperty.call(raw, 'renderVisible')) {
    return raw.renderVisible !== false
  }
  return true
}

function getLoopItemsForRoot(comp: Comp): any[] | null {
  const raw: any = getRenderedProps(comp)
  const enabled = raw?.loopEnabled === true
  if (!enabled) return null
  const items = raw?.loopItems
  return Array.isArray(items) ? items : []
}

function getRenderRepeatsForRoot(comp: Comp, index: number): Array<{ key: string; bindingContext: any; visible: boolean; zIndex: number }> {
  const baseContext = getBindingContextForRoot(comp)
  const visible = isVisibleByRenderControl(comp)
  const zIndex = (getRenderedProps(comp) as any)?.zIndex || index + 1000

  const items = getLoopItemsForRoot(comp)
  if (!items) {
    return [{ key: comp.id, bindingContext: baseContext, visible, zIndex }]
  }

  return items.map((item, i) => ({
    key: `${comp.id}__loop__${i}`,
    bindingContext: mergeBindingContext(baseContext, { loop: { item, index: i } }),
    visible,
    zIndex
  }))
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
      layoutMode: (p?.layoutMode || 'absolute') as any,
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

// 视口中心点
const panState = reactive({
  isPanning: false,
  lastX: 0,
  lastY: 0,
  spaceKeyPressed: false
});

function isNaiveComp(type: CompType) {
  return type.startsWith('n-');
}

// 画布偏移（画布左上角相对于wrapper的位置）
const panOffset = ref({ x: 0, y: 0 });

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

// 右键菜单状态
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  component: null as Comp | null
});

// 计算选中的组件ID（保持向下兼容）
const selectedId = computed(() => {
  return pageStore.selectedComps.length > 0 ? pageStore.selectedComps[0].id : null;
});

// 新增：计算是否有选中组件（支持多选）
const hasSelection = computed(() => {
  return pageStore.selectedComps.length > 0;
});

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
  // 修复：支持多选删除
  if ((e.key === 'Delete' || e.key === 'Backspace') && pageStore.selectedComps.length > 0) {
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

// 处理组件选中
function handleSelect(id: string) {
  emit('select', id);
  log('Component selected:', id);
}

// 处理组件位置更新
function handleUpdatePosition(id: string, updates: Record<string, any>) {
  const comp = pageStore.getComponentById(id);
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
        if (ss && Object.prototype.hasOwnProperty.call(ss, 'default')) {
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

    root.props = {
      ...(root.props || {}),
      __customComponentId: def.id,
      __customComponentName: def.name,
      __customProps: buildDefaultsFromSchema((def as any).propsSchema)
    }

    if (hit) {
      const container = pageStore.getComponentById(hit.containerId);
      const layoutMode = (container?.props as any)?.layoutMode || 'absolute';
      if (layoutMode === 'absolute') {
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
    const layoutMode = (container?.props as any)?.layoutMode || 'absolute';

    const newComp = createComp(componentType, `新建${componentType}`);
    if (layoutMode === 'absolute') {
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

// 撤销重做状态
const canUndo = computed(() => history.canUndo());
const canRedo = computed(() => history.canRedo());

// 删除选中的组件（已支持多选）
function deleteSelectedComponent() {
  const selectedSnapshot = [...pageStore.selectedComps]
  if (selectedSnapshot.length === 0) return

  let blockedCount = 0

  // 重要：emit('delete') 会触发外部更新组件树/选中状态，
  // 不能直接遍历 pageStore.selectedComps（会被边删边改导致只删一个或跳删）。
  for (const comp of selectedSnapshot) {
    if (isProtectedRootContainerInCustomEdit(comp)) {
      blockedCount++
      continue
    }

    const parentContainerId = pageStore.findParentContainerId(comp.id)

    history.addAction({
      type: ActionType.DELETE,
      componentId: comp.id,
      data: {
        before: comp,
        parentContainerId: typeof parentContainerId === 'string' ? parentContainerId : null
      } as any
    })

    emit('delete', comp.id)
  }

  if (blockedCount > 0) {
    message.warning('组件编辑模式下不允许删除最外层容器')
  }

  // 仅当确实删除了内容时才清空选中，避免误清
  if (blockedCount !== selectedSnapshot.length) {
    pageStore.selectComponent(null)
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
          const parentContainerId = (action.data as any).parentContainerId as string | null | undefined;
          if (parentContainerId) {
            emit('addToContainer', { containerId: parentContainerId, comp: action.data.before as Comp });
          } else {
            emit('add', action.data.before as Comp);
          }
        }
        break;
      case ActionType.UPDATE:
        const comp = pageStore.getComponentById(action.componentId);
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
          const parentContainerId = (action.data as any).parentContainerId as string | null | undefined;
          if (parentContainerId) {
            emit('addToContainer', { containerId: parentContainerId, comp: action.data.after as Comp });
          } else {
            emit('add', action.data.after as Comp);
          }
        }
        break;
      case ActionType.DELETE:
        emit('delete', action.componentId);
        break;
      case ActionType.UPDATE:
        const comp = pageStore.getComponentById(action.componentId);
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

// 右键菜单方法
function showContextMenu(event: MouseEvent, component: Comp) {
  event.preventDefault();
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    component
  };
  
  // 选中组件：若当前是多选且右键命中的组件已在选区中，保留多选；否则切到单选。
  const isAlreadySelected = pageStore.selectedComps.some((c) => c.id === component.id)
  if (!isAlreadySelected) emit('select', component.id)
  
  // 点击其他地方隐藏菜单
  document.addEventListener('click', hideContextMenu, { once: true });
}

function hideContextMenu() {
  contextMenu.value.show = false;
}

// 复制组件
function duplicateComponent() {
  if (!contextMenu.value.component) return;
  
  const comp = contextMenu.value.component;
  const newComp = createComp(comp.type, `${comp.name} 副本`);
  
  // 复制属性并偏移位置
  newComp.props = {
    ...comp.props,
    x: (comp.props.x || 0) + 20,
    y: (comp.props.y || 0) + 20
  };
  
  // 记录添加操作
  history.addAction({
    type: ActionType.ADD,
    componentId: newComp.id,
    data: { after: newComp }
  });
  
  emit('add', newComp);
  hideContextMenu();
}

function deepClone<T>(v: T): T {
  try {
    return structuredClone(v)
  } catch {
    return JSON.parse(JSON.stringify(v))
  }
}

function getCompCanvasRectForGroup(comp: Comp): { x: number; y: number; width: number; height: number } {
  const pos = pageStore.getComponentCanvasPosition(comp.id)
  const x = pos?.x ?? (comp.props?.x || 0)
  const y = pos?.y ?? (comp.props?.y || 0)

  const p: any = comp.props || {}
  const widthSizing = p.widthSizing as string | undefined
  const heightSizing = p.heightSizing as string | undefined
  const measuredW = Number(p._measuredWidth)
  const measuredH = Number(p._measuredHeight)
  const rawW = typeof p.width === 'number' ? p.width : Number(p.width)
  const rawH = typeof p.height === 'number' ? p.height : Number(p.height)

  const width = (widthSizing && widthSizing !== 'fixed' && Number.isFinite(measuredW))
    ? measuredW
    : (Number.isFinite(rawW) ? rawW : (Number.isFinite(measuredW) ? measuredW : 100))

  const height = (heightSizing && heightSizing !== 'fixed' && Number.isFinite(measuredH))
    ? measuredH
    : (Number.isFinite(rawH) ? rawH : (Number.isFinite(measuredH) ? measuredH : 100))

  return { x, y, width, height }
}

function saveAsCustomComponent() {
  const selected = pageStore.selectedComps
  const targetComps = selected.length > 0 ? selected : (contextMenu.value.component ? [contextMenu.value.component] : [])
  if (targetComps.length === 0) {
    hideContextMenu()
    return
  }

  const defaultName = targetComps.length > 1 ? `组件组(${targetComps.length})` : `${targetComps[0].name || '组件'}`
  const name = (window.prompt('组件名称', defaultName) || '').trim() || defaultName

  let root: Comp
  if (targetComps.length === 1) {
    root = deepClone(targetComps[0])
    root.props = { ...(root.props || {}), x: 0, y: 0 }
  } else {
    const rects = targetComps.map(getCompCanvasRectForGroup)
    const minX = Math.min(...rects.map(r => r.x))
    const minY = Math.min(...rects.map(r => r.y))
    const maxX = Math.max(...rects.map(r => r.x + r.width))
    const maxY = Math.max(...rects.map(r => r.y + r.height))
    const groupW = Math.max(1, maxX - minX)
    const groupH = Math.max(1, maxY - minY)

    root = createComp(CompType.CONTAINER, name)
    root.props = {
      ...(root.props || {}),
      x: 0,
      y: 0,
      width: groupW,
      height: groupH,
      widthSizing: 'fixed',
      heightSizing: 'fixed',
      layoutMode: 'absolute'
    }

    root.children = targetComps.map((c) => {
      const cloned = deepClone(c)
      const r = getCompCanvasRectForGroup(c)
      cloned.props = { ...(cloned.props || {}), x: r.x - minX, y: r.y - minY }
      return cloned
    })
  }

  const templateJson = exportToJSON([root])
  customComponentsStore.addCustomComponent(name, templateJson)
  hideContextMenu()
}

// 组件层级调整
function bringToFront() {
  if (!contextMenu.value.component) return;
  
  const comp = contextMenu.value.component;
  const maxZIndex = Math.max(...props.components.map(c => c.props.zIndex || 0));
  const newZIndex = maxZIndex + 1;
  
  console.log('[Board] bringToFront:', {
    componentId: comp.id,
    currentZIndex: comp.props.zIndex || 0,
    maxZIndex,
    newZIndex
  });
  
  const updatedComp = {
    ...comp,
    props: {
      ...comp.props,
      zIndex: newZIndex
    }
  };
  
  emit('update', updatedComp);
  hideContextMenu();
}

function sendToBack() {
  if (!contextMenu.value.component) return;
  
  const comp = contextMenu.value.component;
  const currentZIndex = comp.props.zIndex || 1;
  
  // 如果只有一个组件，则不需要操作
  const otherComponents = props.components.filter(c => c.id !== comp.id);
  if (otherComponents.length === 0) {
    console.log('[Board] sendToBack: only one component');
    hideContextMenu();
    return;
  }
  
  const minZIndex = Math.min(...otherComponents.map(c => c.props.zIndex || 1));
  
  // 如果当前组件已经是最底层，则不需要操作
  if (currentZIndex <= minZIndex) {
    console.log('[Board] sendToBack: already at bottom');
    hideContextMenu();
    return;
  }
  
  console.log('[Board] sendToBack:', {
    componentId: comp.id,
    currentZIndex,
    minZIndex,
    action: 'moving to bottom'
  });
  
  // 将目标组件设为zIndex=1，其他所有组件zIndex+1
  const updatedComp = {
    ...comp,
    props: {
      ...comp.props,
      zIndex: 1
    }
  };
  
  // 更新目标组件
  emit('update', updatedComp);
  
  // 将其他所有组件的zIndex增加1
  otherComponents.forEach(otherComp => {
    const updatedOtherComp = {
      ...otherComp,
      props: {
        ...otherComp.props,
        zIndex: (otherComp.props.zIndex || 1) + 1
      }
    };
    emit('update', updatedOtherComp);
  });
  
  hideContextMenu();
}

function bringForward() {
  if (!contextMenu.value.component) return;
  
  const comp = contextMenu.value.component;
  const currentZIndex = comp.props.zIndex || 1;
  const higherComponents = props.components.filter(c => (c.props.zIndex || 1) > currentZIndex);
  
  if (higherComponents.length > 0) {
    const nextZIndex = Math.min(...higherComponents.map(c => c.props.zIndex || 1));
    const newZIndex = nextZIndex + 1;
    
    console.log('[Board] bringForward:', {
      componentId: comp.id,
      currentZIndex,
      nextZIndex,
      newZIndex,
      higherComponentsCount: higherComponents.length
    });
    
    const updatedComp = {
      ...comp,
      props: {
        ...comp.props,
        zIndex: newZIndex
      }
    };
    
    emit('update', updatedComp);
  } else {
    console.log('[Board] bringForward: already at top');
  }
  
  hideContextMenu();
}

function sendBackward() {
  if (!contextMenu.value.component) return;
  
  const comp = contextMenu.value.component;
  const currentZIndex = comp.props.zIndex || 1;
  const lowerComponents = props.components.filter(c => (c.props.zIndex || 1) < currentZIndex);
  
  if (lowerComponents.length > 0) {
    const nextZIndex = Math.max(...lowerComponents.map(c => c.props.zIndex || 1));
    const newZIndex = nextZIndex - 1;
    
    console.log('[Board] sendBackward:', {
      componentId: comp.id,
      currentZIndex,
      nextZIndex,
      newZIndex,
      lowerComponentsCount: lowerComponents.length
    });
    
    const updatedComp = {
      ...comp,
      props: {
        ...comp.props,
        zIndex: Math.max(1, newZIndex)
      }
    };
    
    emit('update', updatedComp);
  } else {
    console.log('[Board] sendBackward: already at bottom');
  }
  
  hideContextMenu();
}

// 删除组件（从右键菜单）
function deleteComponentFromMenu() {
  if (!contextMenu.value.component) return;
  
  const comp = contextMenu.value.component;

  if (isProtectedRootContainerInCustomEdit(comp)) {
    message.warning('组件编辑模式下不允许删除最外层容器')
    hideContextMenu();
    return;
  }
  
  // 记录删除操作
  history.addAction({
    type: ActionType.DELETE,
    componentId: comp.id,
    data: { before: comp }
  });
  
  emit('delete', comp.id);
  hideContextMenu();
}

// 选中组件的层级调整方法
function bringSelectedToFront() {
  if (pageStore.selectedComps.length === 0) return;
  
  const comp = pageStore.selectedComps[0];
  const maxZIndex = Math.max(...props.components.map(c => c.props.zIndex || 1));
  const newZIndex = maxZIndex + 1;
  
  console.log('[Board] bringSelectedToFront:', {
    componentId: comp.id,
    currentZIndex: comp.props.zIndex || 1,
    maxZIndex,
    newZIndex
  });
  
  const updatedComp = {
    ...comp,
    props: {
      ...comp.props,
      zIndex: newZIndex
    }
  };
  
  emit('update', updatedComp);
}

function bringSelectedForward() {
  if (pageStore.selectedComps.length === 0) return;
  
  const comp = pageStore.selectedComps[0];
  const currentZIndex = comp.props.zIndex || 1;
  const higherComponents = props.components.filter(c => (c.props.zIndex || 1) > currentZIndex);
  
  if (higherComponents.length > 0) {
    const nextZIndex = Math.min(...higherComponents.map(c => c.props.zIndex || 1));
    const newZIndex = nextZIndex + 1;
    
    const updatedComp = {
      ...comp,
      props: {
        ...comp.props,
        zIndex: newZIndex
      }
    };
    
    emit('update', updatedComp);
  }
}

function sendSelectedBackward() {
  if (pageStore.selectedComps.length === 0) return;
  
  const comp = pageStore.selectedComps[0];
  const currentZIndex = comp.props.zIndex || 1;
  const lowerComponents = props.components.filter(c => (c.props.zIndex || 1) < currentZIndex);
  
  if (lowerComponents.length > 0) {
    const nextZIndex = Math.max(...lowerComponents.map(c => c.props.zIndex || 1));
    const newZIndex = nextZIndex - 1;
    
    const updatedComp = {
      ...comp,
      props: {
        ...comp.props,
        zIndex: Math.max(1, newZIndex)
      }
    };
    
    emit('update', updatedComp);
  }
}

function sendSelectedToBack() {
  if (pageStore.selectedComps.length === 0) return;
  
  const comp = pageStore.selectedComps[0];
  const currentZIndex = comp.props.zIndex || 1;
  
  // 如果只有一个组件，则不需要操作
  const otherComponents = props.components.filter(c => c.id !== comp.id);
  if (otherComponents.length === 0) {
    console.log('[Board] sendSelectedToBack: only one component');
    return;
  }
  
  const minZIndex = Math.min(...otherComponents.map(c => c.props.zIndex || 1));
  
  // 如果当前组件已经是最底层，则不需要操作
  if (currentZIndex <= minZIndex) {
    console.log('[Board] sendSelectedToBack: already at bottom');
    return;
  }
  
  console.log('[Board] sendSelectedToBack:', {
    componentId: comp.id,
    currentZIndex,
    minZIndex,
    action: 'moving to bottom'
  });
  
  // 将目标组件设为zIndex=1，其他所有组件zIndex+1
  const updatedComp = {
    ...comp,
    props: {
      ...comp.props,
      zIndex: 1
    }
  };
  
  // 更新目标组件
  emit('update', updatedComp);
  
  // 将其他所有组件的zIndex增加1
  otherComponents.forEach(otherComp => {
    const updatedOtherComp = {
      ...otherComp,
      props: {
        ...otherComp.props,
        zIndex: (otherComp.props.zIndex || 1) + 1
      }
    };
    emit('update', updatedOtherComp);
  });
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
