<template>
  <div class="properties-panel">
    <!-- 组件属性编辑 -->
    <div v-if="props.component" class="panel-content">
      <!-- 现有的组件属性编辑代码 -->
      <div class="tabs">
        <button class="tab-button" 
                :class="{ active: activeTab === 'properties' }"
                @click="activeTab = 'properties'">
          属性
        </button>
        <button class="tab-button" 
                :class="{ active: activeTab === 'events' }"
                @click="activeTab = 'events'">
          事件
        </button>
      </div>

      <!-- 标签页内容 -->
      <div class="tab-content">
        <!-- 属性面板 -->
        <div v-show="activeTab === 'properties'">
          <!-- 组件编辑模式：Props/State 在左侧【数据】面板维护 -->
          <PropertySection v-if="isCustomEditMode && editingDef" :title="`组件定义：${editingDef.name}`">
            <template #content>
              <div style="padding: 8px; font-size: 11px; color: #999; line-height: 1.5;">
                Props / State 的增删与字段配置请在左侧【数据】面板完成。
              </div>
            </template>
          </PropertySection>

          <!-- 页面模式：只允许编辑已定义的实例参数（不允许随意新增） -->
          <DynamicProperties
            v-else-if="customMeta && customDef"
            title="组件属性"
            :modelValue="customMeta.props"
            :bindings="customMeta.bindings"
            :propsSchema="customDef.propsSchema || {}"
            :loopAvailable="loopContextInfo.available"
            :loopItemSample="loopContextInfo.itemSample"
            :isCustomEditMode="isCustomEditMode"
            @change="updateCustomInstanceProps"
            @update:bindings="updateCustomInstanceBindings"
            @create-prop="handleCreateProp"
          />

          <!-- 组件信息 -->
          <InfoProperties
            :id="props.component.id"
            :name="props.component.name"
            :type="props.component.type"
            @update="updateName"
          />

          <!-- 布局属性 -->
          <LayoutProperties 
            :x="props.component.props.x || 0"
            :y="props.component.props.y || 0"
            :width="props.component.props.width"
            :height="props.component.props.height"
            :widthSizing="props.component.props.widthSizing"
            :heightSizing="props.component.props.heightSizing"
            @update="updateProps" />

          <ContainerLayoutProperties
            v-if="props.component.type === 'container'"
            :layoutMode="props.component.props.layoutMode"
            :direction="props.component.props.direction"
            :primaryAlign="props.component.props.primaryAlign"
            :crossAlign="props.component.props.crossAlign"
            :gap="props.component.props.gap"
            @update="updateProps"
          />

          <!-- Naive UI组件属性（只在没有自定义组件实例时显示）-->
          <DynamicProperties
            v-if="naiveConfig && !customMeta"
            title="组件属性"
            :modelValue="props.component.props"
            :bindings="props.component.bindings || {}"
            :customProps="bindingCustomProps"
            :customPropsCtxPath="bindingCustomPropsCtxPath"
            :customPropsLabel="bindingCustomPropsLabel"
            :loopAvailable="loopContextInfo.available"
            :loopItemSample="loopContextInfo.itemSample"
            :propsSchema="naiveConfig.propsSchema"
            :isCustomEditMode="isCustomEditMode"
            @change="updateProps"
            @update:bindings="updateBindings"
            @create-prop="handleCreateProp"
          />

          <SpacingProperties v-bind="props.component.props"
                           @update="updateProps" />

          <!-- 文字属性 -->
          <TextProperties v-if="props.component.type === 'text' || props.component.type === 'button'"
                         :content="props.component.props.content || ''"
                         :color="props.component.props.color"
                         :fontSize="props.component.props.fontSize"
                         :fontWeight="props.component.props.fontWeight"
                         :fontFamily="props.component.props.fontFamily"
                         :textDecoration="props.component.props.textDecoration"
                         :fontStyle="props.component.props.fontStyle"
                         :width="props.component.props.width"
                         :height="props.component.props.height"
                         :widthMode="props.component.props.widthMode"
                         :autoHeight="props.component.props.autoHeight"
                         :bindings="props.component.bindings || {}"
                         :customProps="bindingCustomProps"
                         :customPropsCtxPath="bindingCustomPropsCtxPath"
                         :customPropsLabel="bindingCustomPropsLabel"
                         :loopAvailable="loopContextInfo.available"
                         :loopItemSample="loopContextInfo.itemSample"
                         @update:bindings="updateBindings"
                         @update="updateProps" />

          <BorderProperties v-bind="props.component.props"
                          @update="updateProps" />

          <BorderRadiusProperties v-bind="props.component.props"
                               @update="updateProps" />

          <ShadowProperties v-bind="props.component.props"
                          @update="updateProps" />

          <BackgroundProperties v-bind="props.component.props"
                           @update="updateProps" />

          <!-- 渲染配置 -->
          <RenderOptionProperties
            :renderVisible="(props.component.props as any)?.renderVisible"
            :loopEnabled="(props.component.props as any)?.loopEnabled"
            :renderVisibleBinding="(props.component.bindings as any)?.renderVisible || ''"
            :loopItemsBinding="(props.component.bindings as any)?.loopItems || ''"
            :loopValidationMessage="loopValidationMessage"
            :pageVariableTree="pageVariableTree"
            :arrayVariables="currentPage?.variables || []"
            @update="updateProps"
            @updateBindings="updateRenderBindings"
          />
        </div>

        <!-- 事件面板 -->
        <div v-show="activeTab === 'events'">
          <EventTab
            v-if="props.component"
            :component="props.component"
            :currentPage="currentPage"
            :editingCustomEventsSchema="editingCustomEventsSchema"
            @update="handleUpdate"
            @open-flow-editor="handleOpenFlowEditor"
          />
        </div>
      </div>
    </div>

    <!-- 页面属性编辑（当无选中组件时自动显示） -->
    <div v-else-if="currentPage" class="panel-content">
      <PageProperties :page="currentPage" />
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">🎨</div>
      <p>暂无内容</p>
      <small>创建页面或添加组件开始编辑</small>
    </div>

    <!-- 快速绑定弹窗 -->
    <n-modal v-model:show="showAutoBindModal" preset="dialog" title="快速绑定组件属性" style="width: 500px">
      <div v-if="customMeta && customDef" class="auto-bind-content">
        <p style="margin-bottom: 12px; font-size: 13px; color: #666;">
          已绑定循环数据，可以在此快速将组件属性绑定到 item 字段。
        </p>
        <DynamicProperties
          :modelValue="customMeta.props"
          :bindings="customMeta.bindings"
          :propsSchema="customDef.propsSchema || {}"
          :loopAvailable="true"
          :loopItemSample="showAutoBindModal ? (manualLoopItemSample || loopContextInfo.itemSample) : loopContextInfo.itemSample"
          @change="updateCustomInstanceProps"
          @update:bindings="updateCustomInstanceBindings"
        />
      </div>
    </n-modal>
  </div>
 </template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { NButton, NIcon, NCheckbox, NPopover, NSelect, NModal } from 'naive-ui';
import { GitNetwork, Link, LinkOutline } from '@vicons/ionicons5';
import LayoutProperties from '../properties/LayoutProperties.vue';
import ContainerLayoutProperties from '../properties/ContainerLayoutProperties.vue';
import TextProperties from '../properties/TextProperties.vue';
import BorderProperties from '../properties/BorderProperties.vue';
import BorderRadiusProperties from '../properties/BorderRadiusProperties.vue';
import ShadowProperties from '../properties/ShadowProperties.vue';
import BackgroundProperties from '../properties/BackgroundProperties.vue';
import SpacingProperties from '../properties/SpacingProperties.vue';
import DynamicProperties from '../properties/DynamicProperties.vue';
import PageProperties from '../properties/PageProperties.vue';
import RenderOptionProperties from '../properties/RenderOptionProperties.vue';
import InfoProperties from '../properties/InfoProperties.vue';
import EventTab from './EventTab.vue';
import { buildPageVariableTree } from '../flow/variableTree'
import { getNaiveConfig } from '../../config/naive-ui-registry';
import type { PropSchema } from '../../config/naive-ui-registry'
import type { EventSpec } from '../../types/event'
import { usePageStore } from '../../stores/page';
import { useCustomComponentsStore } from '../../stores/customComponents'
import type { Comp } from '../comps/base';
import { resolveBindingRef, formatBindingRefDisplay } from '../../utils/bindingRef'

const props = defineProps<{
  component: Comp | null;
  editingCustomDefId?: string | null;
  editingCustomDefName?: string | null;
  editingCustomPropsSchema?: Record<string, PropSchema> | null;
  editingCustomEventsSchema?: Record<string, EventSpec> | null;
}>();

const emit = defineEmits(['update', 'open-flow-editor', 'update-custom-props-schema']);
const pageStore = usePageStore();
const customComponentsStore = useCustomComponentsStore()
const currentPage = computed(() => pageStore.currentPage);

const isCustomEditMode = computed(() => pageStore.editorMode === 'custom-edit')

const editingDef = computed(() => {
  if (!isCustomEditMode.value) return null
  if (!props.editingCustomDefId) return null
  return {
    id: props.editingCustomDefId,
    name: props.editingCustomDefName || ''
  }
})

const activeTab = ref('properties');
const naiveConfig = computed(() => props.component ? getNaiveConfig(props.component.type) : undefined);
const showAutoBindModal = ref(false);
const manualLoopItemSample = ref<any>(undefined);

// 渲染配置绑定更新
function updateRenderBindings(key: string, value: string | null) {
  if (!props.component) return
  const newBindings = { ...(props.component.bindings || {}) }
  if (value === null) {
    delete newBindings[key]
  } else {
    newBindings[key] = value
  }
  emit('update', {
    id: props.component.id,
    type: props.component.type,
    bindings: newBindings
  })

  // 如果绑定了循环数据，且是自定义组件，自动弹出属性绑定框
  if (key === 'loopItems' && value && customMeta.value) {
    // 主动解析一次 sample，因为此时 props 还没更新回传，computed loopContextInfo 拿不到新绑定
    const resolved = resolveBindingRef(value, {
      getVarValue: (name) => pageStore.getVariableValue(name),
      getCompProp: (componentId, propKey) => pageStore.getComponentById(componentId)?.props?.[propKey],
      context: bindingContextForValidation.value
    })

    if (Array.isArray(resolved) && resolved.length > 0) {
      manualLoopItemSample.value = resolved[0]
    } else {
      manualLoopItemSample.value = undefined
    }

    showAutoBindModal.value = true
  }
}

const customMeta = computed(() => {
  const c = props.component
  if (!c) return null
  const custom = c.custom
  if (!custom?.defId) return null
  const def = customComponentsStore.getById(custom.defId)
  return {
    id: String(custom.defId),
    name: String(def?.name || ''),
    props: (custom.props && typeof custom.props === 'object') ? custom.props : {},
    bindings: (custom.bindings && typeof custom.bindings === 'object') ? custom.bindings : {}
  }
})

const customDef = computed(() => {
  const meta = customMeta.value
  if (!meta) return null
  return customComponentsStore.getById(meta.id) || null
})

const customInstanceRoot = computed(() => {
  const c = props.component
  if (!c) return null

  let cur: Comp | undefined = c
  while (cur) {
    if (cur.custom?.defId) return cur
    const parentId = pageStore.findParentContainerId(cur.id)
    if (!parentId) break
    cur = pageStore.getComponentById(parentId)
  }
  return null
})

const bindingCustomProps = computed(() => {
  if (isCustomEditMode.value) {
    const schema = props.editingCustomPropsSchema || {}
    const preview: Record<string, any> = {}
    for (const [k, s] of Object.entries(schema)) {
      const ss: any = s
      if (ss && Object.prototype.hasOwnProperty.call(ss, 'manual')) preview[k] = ss.default
      else if (ss?.type === 'number') preview[k] = 0
      else if (ss?.type === 'boolean') preview[k] = false
      else if (ss?.type === 'json') preview[k] = null
      else preview[k] = ''
    }
    return preview
  }

  const root = customInstanceRoot.value
  if (!root) return null
  const cp = root.custom?.props
  return (cp && typeof cp === 'object') ? cp : null
})

const bindingCustomPropsCtxPath = computed(() => (isCustomEditMode.value ? 'props' : 'customProps'))
const bindingCustomPropsLabel = computed(() => (isCustomEditMode.value ? '组件参数' : '自定义组件参数'))

const bindingContextForValidation = computed(() => {
  const base: any = {}
  const cp = bindingCustomProps.value
  if (cp && typeof cp === 'object') {
    // 渲染层实际注入了 props/customProps 双别名（custom-edit 时为 props）
    base.customProps = cp
    base.props = cp
  }
  return base
})

const loopContextInfo = computed(() => {
  const selected = props.component
  if (!selected) return { available: false, itemSample: undefined as any }

  let cur: Comp | null = selected
  while (cur) {
    const enabled = (cur.props as any)?.loopEnabled === true
    if (enabled) {
      const ref = (cur.bindings as any)?.loopItems
      const hasRef = typeof ref === 'string' && !!ref
      const raw = (cur.props as any)?.loopItems

      const resolved = hasRef
        ? resolveBindingRef(ref, {
            getVarValue: (name) => pageStore.getVariableValue(name),
            getCompProp: (componentId, propKey) => pageStore.getComponentById(componentId)?.props?.[propKey],
            context: bindingContextForValidation.value
          })
        : raw

      if (Array.isArray(resolved)) {
        return {
          available: true,
          itemSample: resolved.length > 0 ? resolved[0] : undefined
        }
      }
    }

    const parentId = pageStore.findParentContainerId(cur.id)
    if (!parentId) break
    cur = pageStore.getComponentById(parentId) || null
  }

  return { available: false, itemSample: undefined as any }
})

const loopValidationMessage = computed(() => {
  const comp = props.component
  if (!comp) return ''

  const loopEnabled = (comp.props as any)?.loopEnabled === true
  if (!loopEnabled) return ''

  const ref = (comp.bindings as any)?.loopItems
  if (typeof ref !== 'string' || !ref) {
    return '启用循环渲染后，需要将"数组数据"绑定到一个数组类型的数据源。'
  }

  const resolved = resolveBindingRef(ref, {
    getVarValue: (name) => pageStore.getVariableValue(name),
    getCompProp: (componentId, propKey) => pageStore.getComponentById(componentId)?.props?.[propKey],
    context: bindingContextForValidation.value
  })

  if (!Array.isArray(resolved)) {
    return '"数组数据"当前绑定的值不是数组，请改为绑定数组类型变量/上下文数据。'
  }

  return ''
})

// 页面变量树（用于渲染配置）
const pageVariableTree = computed(() => buildPageVariableTree(pageStore, {
  loopAvailable: loopContextInfo.value.available,
  loopItemSample: loopContextInfo.value.itemSample
}))

function updateName(updates: { name?: string }) {
  if (!props.component) return
  if (!updates.name && updates.name !== '') return

  emit('update', {
    id: props.component.id,
    type: props.component.type,
    name: updates.name
  } as any)
}

function updateCustomInstanceProps(updates: Record<string, any>) {
  if (!props.component) return
  const custom = props.component.custom
  if (!custom) return

  const processedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
    if (typeof value === 'string' && !isNaN(Number(value))) {
      acc[key] = Number(value)
    } else {
      acc[key] = value
    }
    return acc
  }, {} as Record<string, any>)

  const next = { ...(custom.props || {}) }
  Object.assign(next, processedUpdates)

  emit('update', {
    id: props.component.id,
    type: props.component.type,
    custom: {
      ...custom,
      props: next
    }
  } as any)
}

function updateCustomInstanceBindings(updates: Record<string, string | null>) {
  if (!props.component) return
  const custom = props.component.custom
  if (!custom) return

  const next = { ...(custom.bindings || {}) }
  for (const [k, v] of Object.entries(updates || {})) {
    if (v === null) delete next[k]
    else next[k] = v
  }

  emit('update', {
    id: props.component.id,
    type: props.component.type,
    custom: {
      ...custom,
      bindings: next
    }
  } as any)
}

function handleCreateProp(payload: { name: string; type: string; defaultValue: any }) {
  if (!isCustomEditMode.value || !props.editingCustomPropsSchema) return
  
  const next = { ...props.editingCustomPropsSchema }
  if (next[payload.name]) {
    console.warn('Prop already exists:', payload.name)
    return
  }

  next[payload.name] = {
    label: payload.name,
    type: payload.type as any,
    default: payload.defaultValue
  }
  
  emit('update-custom-props-schema', next)
}

// 更新属性
function updateProps(updates: Record<string, any>) {
  if (!props.component) return;
  
  // 处理数值类型的属性
  const processedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
    if (typeof value === 'string' && !isNaN(Number(value))) {
      acc[key] = Number(value);
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);

  emit('update', {
    id: props.component.id,
    type: props.component.type,
    props: processedUpdates
  });
}

// 更新绑定
function updateBindings(updates: Record<string, string | null>) {
  if (!props.component) return;

  const newBindings = { ...(props.component.bindings || {}) };

  Object.entries(updates).forEach(([key, value]) => {
    if (value === null) {
      delete newBindings[key];
    } else {
      newBindings[key] = value;
    }
  });

  emit('update', {
    id: props.component.id,
    type: props.component.type,
    bindings: newBindings
  });
}

// 处理 EventTab 的 update 事件
function handleUpdate(data: any) {
  emit('update', data);
}

// 处理 EventTab 的 open-flow-editor 事件
function handleOpenFlowEditor(flowId?: string) {
  emit('open-flow-editor', flowId);
}
</script>

<style scoped>
.properties-panel {
  width: 240px;
  height: 100vh; /* 关键：使用视口高度 */
  max-height: 100vh; /* 关键：限制最大高度 */
  background: #ffffff;
  border-left: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  user-select: none;
  overflow: hidden; /* 关键：防止面板本身溢出 */
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0; /* 关键：允许flex子项收缩 */
  height: 100%; /* 关键：确保占满父容器 */
}

/* 标签页样式 */
.tabs {
  height: 36px;
  display: flex;
  border-bottom: 1px solid #e5e5e5;
  padding: 0 8px;
  flex-shrink: 0; /* 防止标签页被压缩 */
}

.tab-button {
  height: 36px;
  padding: 0 16px;
  border: none;
  background: none;
  font-size: 11px;
  color: #333;
  cursor: pointer;
  position: relative;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tab-button.active {
  color: #000;
}

.tab-button.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: #000;
}

.tab-content {
  flex: 1;
  overflow-y: auto; /* 只在内容区域滚动 */
  overflow-x: hidden;
  min-height: 0; /* 关键：允许flex子项收缩 */
  height: 0; /* 强制高度为0，让flex子元素撑开 */
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #d9d9d9 transparent;
}

.tab-content::-webkit-scrollbar {
  width: 6px;
}

.tab-content::-webkit-scrollbar-track {
  background: transparent;
}

.tab-content::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

/* 确保tab-content内的v-show div正确布局 */
.tab-content > div {
  min-height: 0;
  display: block;
  width: 100%;
}

/* Section样式（优先级高于PropertySection） */
.properties-panel .section {
  margin-bottom: 0;
  border-bottom: 1px solid #e5e5e5 !important;
}

/* 空状态 */
.empty-tip {
  padding: 16px;
  text-align: center;
  font-size: 11px;
  color: #999;
}

.no-actions {
  padding: 16px;
  text-align: center;
  font-size: 11px;
  color: #999;
  background: #fff;
}
</style>
