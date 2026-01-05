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
          <div v-if="isCustomEditMode && editingDef" class="section" style="margin-bottom: 8px;">
            <div class="section-header">
              <span>组件定义：{{ editingDef.name }}</span>
            </div>
            <div class="section-content" style="padding: 8px; font-size: 12px; color: #666;">
              Props / State 的增删与字段配置请在左侧【数据】面板完成。
            </div>
          </div>

          <!-- 页面模式：只允许编辑已定义的实例参数（不允许随意新增） -->
          <div v-else-if="customMeta && customDef" class="section" style="margin-bottom: 8px;">
            <div class="section-header">
              <span>组件属性</span>
            </div>
            <div class="section-content" style="padding: 0;">
              <DynamicProperties
                :modelValue="customMeta.props"
                :bindings="customMeta.bindings"
                :propsSchema="customDef.propsSchema || {}"
                :loopAvailable="loopContextInfo.available"
                :loopItemSample="loopContextInfo.itemSample"
                @change="updateCustomInstanceProps"
                @update:bindings="updateCustomInstanceBindings"
              />
            </div>
          </div>

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
            :flexDirection="props.component.props.flexDirection"
            :justifyContent="props.component.props.justifyContent"
            :alignItems="props.component.props.alignItems"
            :gap="props.component.props.gap"
            @update="updateProps"
          />

          <template v-if="naiveConfig">
            <div class="section-title" style="padding: 12px 12px 0; font-size: 12px; font-weight: bold; color: #333;">组件属性</div>
            <DynamicProperties :modelValue="props.component.props"
                               :bindings="props.component.bindings || {}"
                               :customProps="bindingCustomProps"
                               :customPropsCtxPath="bindingCustomPropsCtxPath"
                               :customPropsLabel="bindingCustomPropsLabel"
                               :loopAvailable="loopContextInfo.available"
                               :loopItemSample="loopContextInfo.itemSample"
                               :propsSchema="naiveConfig.propsSchema"
                               @change="updateProps"
                               @update:bindings="updateBindings" />
          </template>

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
          <div class="section" style="margin-top: 12px;">
            <div class="section-header">
              <span>渲染配置</span>
            </div>
            <div class="dynamic-properties">
              <!-- 是否显示 -->
              <div class="property-row">
                <div class="prop-label">
                  <span class="label-text">是否显示</span>
                  <span v-if="renderVisibleBinding" class="bind-badge">
                    {{ formatBindingDisplay(renderVisibleBinding) }}
                  </span>
                </div>
                <div class="input-wrapper">
                  <div v-if="renderVisibleBinding" class="bound-placeholder" />
                  <div v-else class="checkbox-wrapper">
                    <input type="checkbox"
                           :checked="renderVisibleValue"
                           @change="updateProps({ renderVisible: ($event.target as HTMLInputElement).checked })" />
                  </div>
                </div>
                <n-popover
                  trigger="click"
                  placement="left"
                  :show-arrow="false"
                  style="width: 420px"
                  :show="renderBindingOpenKey === 'renderVisible'"
                  @update:show="(v) => (renderBindingOpenKey = v ? 'renderVisible' : null)"
                >
                  <template #trigger>
                    <n-button
                      size="tiny"
                      quaternary
                      circle
                      :type="renderVisibleBinding ? 'error' : 'default'"
                      class="bind-btn"
                      title="绑定变量"
                    >
                      <template #icon>
                        <n-icon><Link v-if="renderVisibleBinding" /><LinkOutline v-else /></n-icon>
                      </template>
                    </n-button>
                  </template>
                  <VariablePanel
                    :data="pageVariableTree"
                    tip="点击变量直接绑定"
                    select-mode="value"
                    confirmable
                    @select="(p) => p.value && handleRenderBindPick('renderVisible', p.value)"
                    @cancel="renderBindingOpenKey = null"
                  />
                </n-popover>
              </div>

              <!-- 启用循环渲染 -->
              <div class="property-row">
                <div class="prop-label">
                  <span class="label-text">启用循环渲染</span>
                </div>
                <div class="input-wrapper">
                  <div class="checkbox-wrapper">
                    <input type="checkbox"
                           :checked="loopEnabledValue"
                           @change="updateProps({ loopEnabled: ($event.target as HTMLInputElement).checked })" />
                  </div>
                </div>
              </div>

              <!-- 绑定循环数据 -->
              <div v-if="loopEnabledValue" class="property-row">
                <div class="prop-label">
                  <span class="label-text">循环数据</span>
                  <span v-if="loopItemsBinding" class="bind-badge">
                    {{ formatBindingDisplay(loopItemsBinding) }}
                  </span>
                </div>
                <div class="input-wrapper">
                  <div v-if="loopItemsBinding" class="bound-placeholder" />
                  <n-select
                    v-else
                    size="small"
                    placeholder="选择数组变量"
                    :options="arrayVariableOptions"
                    :value="loopItemsBinding"
                    @update:value="updateLoopItemsBinding"
                    clearable
                  />
                </div>
                <n-popover
                  trigger="click"
                  placement="left"
                  :show-arrow="false"
                  style="width: 420px"
                  :show="renderBindingOpenKey === 'loopItems'"
                  @update:show="(v) => (renderBindingOpenKey = v ? 'loopItems' : null)"
                >
                  <template #trigger>
                    <n-button
                      size="tiny"
                      quaternary
                      circle
                      :type="loopItemsBinding ? 'error' : 'default'"
                      class="bind-btn"
                      title="绑定变量"
                    >
                      <template #icon>
                        <n-icon><Link v-if="loopItemsBinding" /><LinkOutline v-else /></n-icon>
                      </template>
                    </n-button>
                  </template>
                  <VariablePanel
                    :data="pageVariableTree"
                    tip="点击变量直接绑定"
                    select-mode="value"
                    confirmable
                    @select="(p) => p.value && handleRenderBindPick('loopItems', p.value)"
                    @cancel="renderBindingOpenKey = null"
                  />
                </n-popover>
              </div>

              <div v-if="loopValidationMessage" class="loop-warning">
                {{ loopValidationMessage }}
              </div>
            </div>
          </div>
        </div>

        <!-- 事件面板 -->
        <div v-show="activeTab === 'events'">
          <div class="section">
            <div class="section-header">
              <span>事件列表</span>
            </div>
            <div class="section-content">
              <div class="event-list">
                <div v-for="eventDef in supportedEvents" 
                     :key="eventDef.value" 
                     class="event-item">
                  <div class="event-header">
                    <span>{{ eventDef.label }} ({{ eventDef.value }})</span>
                  </div>
                  
                  <!-- Flow 绑定 -->
                  <div class="flow-binding" style="padding: 8px; border-bottom: 1px solid #eee; display: flex; gap: 4px;">
                    <n-select 
                      size="small" 
                      placeholder="绑定逻辑流" 
                      :options="flowOptions" 
                      :value="getFlowForEvent(eventDef.value) || ''"
                      @update:value="(val) => updateEventFlow(eventDef.value, val)"
                      clearable
                      style="flex: 1"
                    />
                    <n-button size="small" secondary type="info" 
                              :disabled="!getFlowForEvent(eventDef.value)"
                              @click="openFlowEditor(getFlowForEvent(eventDef.value))">
                      <template #icon><n-icon><Create /></n-icon></template>
                    </n-button>
                  </div>

                  <!-- 已配置的动作列表 (保留以兼容旧数据，或者作为 Flow 的补充) -->
                  <div v-if="!getFlowForEvent(eventDef.value)">
                    <div class="action-list-header" style="padding: 4px 8px; display: flex; justify-content: space-between; align-items: center;">
                      <span style="font-size: 10px; color: #999;">或直接添加动作:</span>
                      <n-button size="tiny" secondary type="primary" @click="addEventAction(eventDef.value)">
                        <template #icon><n-icon><Add /></n-icon></template>
                      </n-button>
                    </div>
                    <div v-if="getActionsForEvent(eventDef.value).length > 0" class="action-list">
                      <div v-for="(action, index) in getActionsForEvent(eventDef.value)" :key="index" class="action-item">
                        <div class="action-header">
                          <span class="action-type">{{ getActionLabel(action.type) }}</span>
                          <div class="action-tools">
                            <n-button size="tiny" quaternary circle @click="editAction(eventDef.value, index)">
                              <template #icon><n-icon><Create /></n-icon></template>
                            </n-button>
                            <n-button size="tiny" quaternary circle type="error" @click="removeAction(eventDef.value, index)">
                              <template #icon><n-icon><Trash /></n-icon></template>
                            </n-button>
                          </div>
                        </div>
                        <div class="action-desc">{{ getActionDesc(action) }}</div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="flow-active-tip" style="padding: 8px; font-size: 11px; color: #1890ff; background: #e6f7ff;">
                    已绑定逻辑流，直接动作将被忽略
                  </div>
                </div>
              </div>
            </div>
          </div>
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

    <!-- 动作配置弹窗 -->
    <n-modal v-model:show="showActionModal" preset="dialog" :title="editingActionIndex === -1 ? '添加动作' : '编辑动作'">
      <n-form size="small" label-placement="left" label-width="80">
        <n-form-item label="动作类型">
          <n-select v-model:value="currentAction.type" :options="actionTypeOptions" @update:value="handleActionTypeChange" />
        </n-form-item>
        
        <!-- 动态渲染参数表单 -->
        <template v-if="currentActionDef">
          <n-form-item v-for="(schema, key) in currentActionDef.paramsSchema" :key="key" :label="schema.label">
            <!-- 变量选择特殊处理 -->
            <n-select v-if="key === 'variableName'" 
                      v-model:value="currentAction.params[key]" 
                      :options="variableOptions" 
                      placeholder="选择变量" />
            
            <n-input v-else-if="schema.type === 'text'" v-model:value="currentAction.params[key]" />
            <n-input-number v-else-if="schema.type === 'number'" v-model:value="currentAction.params[key]" />
            <n-switch v-else-if="schema.type === 'boolean'" v-model:value="currentAction.params[key]" />
            <n-select v-else-if="schema.type === 'select'" v-model:value="currentAction.params[key]" :options="schema.options" />
            <n-input v-else-if="schema.type === 'json'" type="textarea" v-model:value="currentAction.params[key]" placeholder="JSON/代码" />
          </n-form-item>
        </template>
      </n-form>
      <template #action>
        <n-button size="small" @click="showActionModal = false">取消</n-button>
        <n-button size="small" type="primary" @click="saveAction">保存</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { 
  NButton, NIcon, NModal, NForm, NFormItem, NSelect, NInput, NInputNumber, NSwitch, NCheckbox, NPopover 
} from 'naive-ui';
import { Add, Trash, Create, GitNetwork, Link, LinkOutline } from '@vicons/ionicons5';
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
import VariablePanel from '../flow/VariablePanel.vue';
import { buildPageVariableTree } from '../flow/variableTree'
import { getNaiveConfig } from '../../config/naive-ui-registry';
import type { PropSchema } from '../../config/naive-ui-registry'
import { usePageStore } from '../../stores/page';
import { useCustomComponentsStore } from '../../stores/customComponents'
import type { Comp } from '../comps/base';
import type { CompEventAction } from '../comps/base';
import { actionRegistry } from '../../config/actions';
import { resolveBindingRef, formatBindingRefDisplay } from '../../utils/bindingRef'

const props = defineProps<{
  component: Comp | null;
  editingCustomDefId?: string | null;
  editingCustomDefName?: string | null;
  editingCustomPropsSchema?: Record<string, PropSchema> | null;
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

const schemaTypeOptions = [
  { label: '文本', value: 'text' },
  { label: '数字', value: 'number' },
  { label: '布尔', value: 'boolean' },
  { label: '颜色', value: 'color' },
  { label: 'JSON', value: 'json' }
]

const schemaEntries = computed(() => {
  const schema = props.editingCustomPropsSchema || {}
  return Object.keys(schema)
    .sort()
    .map((k) => ({ key: k, schema: schema[k] }))
})

const newSchemaKey = ref('')
const newSchemaLabel = ref('')
const newSchemaType = ref<'text' | 'number' | 'boolean' | 'color' | 'json'>('text')
const newSchemaDefault = ref('')

function parseDefaultByType(type: string, raw: string): any {
  if (type === 'number') return Number(raw)
  if (type === 'boolean') return raw === 'true'
  if (type === 'json') {
    try {
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }
  return raw
}

function updateSchema(next: Record<string, PropSchema>) {
  emit('update-custom-props-schema', next)
}

function addSchemaProp() {
  const key = newSchemaKey.value.trim()
  if (!key) return
  const label = newSchemaLabel.value.trim() || key
  const type = newSchemaType.value
  const next: Record<string, PropSchema> = { ...(props.editingCustomPropsSchema || {}) }
  next[key] = {
    label,
    type,
    default: parseDefaultByType(type, newSchemaDefault.value)
  }
  newSchemaKey.value = ''
  newSchemaLabel.value = ''
  newSchemaDefault.value = ''
  updateSchema(next)
}

function updateSchemaProp(key: string, patch: Partial<PropSchema>) {
  const cur = (props.editingCustomPropsSchema || {})
  const prev = cur[key]
  if (!prev) return
  const next: Record<string, PropSchema> = { ...cur }
  next[key] = { ...prev, ...patch }
  updateSchema(next)
}

function removeSchemaProp(key: string) {
  const cur = (props.editingCustomPropsSchema || {})
  if (!(key in cur)) return
  const next: Record<string, PropSchema> = { ...cur }
  delete next[key]
  updateSchema(next)
}

const activeTab = ref('properties');
const naiveConfig = computed(() => props.component ? getNaiveConfig(props.component.type) : undefined);

const renderVisibilitySchema: Record<string, PropSchema> = {
  renderVisible: { label: '显示', type: 'boolean', default: true } as any
}

const renderLoopSchema: Record<string, PropSchema> = {
  loopEnabled: { label: '启用', type: 'boolean', default: false } as any,
  loopItems: { label: '数组数据', type: 'json', default: [] } as any
}

// 渲染配置响应式变量
const renderVisibleValue = computed({
  get: () => {
    const comp = props.component
    if (!comp) return true
    const visible = (comp.props as any)?.renderVisible
    return visible !== false
  },
  set: (value: boolean) => {
    updateProps({ renderVisible: value })
  }
})

const loopEnabledValue = computed({
  get: () => {
    const comp = props.component
    if (!comp) return false
    return (comp.props as any)?.loopEnabled === true
  },
  set: (value: boolean) => {
    updateProps({ loopEnabled: value })
  }
})

const renderVisibleBinding = computed(() => {
  const comp = props.component
  if (!comp) return ''
  return (comp.bindings as any)?.renderVisible || ''
})

const loopItemsBinding = computed(() => {
  const comp = props.component
  if (!comp) return ''
  return (comp.bindings as any)?.loopItems || ''
})

// 绑定面板打开状态
const renderBindingOpenKey = ref<string | null>(null)

// 页面变量树
const pageVariableTree = computed(() => buildPageVariableTree(pageStore, {
  loopAvailable: loopContextInfo.value.available,
  loopItemSample: loopContextInfo.value.itemSample
}))

// 数组变量选项（用于循环数据的下拉选择）
const arrayVariableOptions = computed(() => {
  const vars = currentPage.value?.variables || []
  return vars
    .filter(v => v.type === 'array')
    .map(v => ({ label: v.name, value: `var:${v.name}` }))
})

function updateLoopItemsBinding(value: string | null) {
  if (!props.component) return
  const newBindings = { ...(props.component.bindings || {}) }
  if (value === null || value === '') {
    delete newBindings.loopItems
  } else {
    newBindings.loopItems = value
  }
  emit('update', {
    id: props.component.id,
    type: props.component.type,
    bindings: newBindings
  })
}

function handleRenderBindPick(key: string, value: string) {
  if (!props.component) return
  const newBindings = { ...(props.component.bindings || {}) }
  if (value === '__unbind__') {
    delete newBindings[key]
  } else {
    newBindings[key] = value
  }
  emit('update', {
    id: props.component.id,
    type: props.component.type,
    bindings: newBindings
  })
  renderBindingOpenKey.value = null
}

function formatBindingDisplay(binding: string): string {
  return formatBindingRefDisplay(binding, {
    getComponentLabel: (componentId) => {
      const comp = pageStore.currentPage?.components?.find(c => c.id === componentId)
      return comp?.name || componentId
    }
  })
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
      if (ss && Object.prototype.hasOwnProperty.call(ss, 'default')) preview[k] = ss.default
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

  const loopEnabled = !!(comp.props as any)?.loopEnabled
  if (!loopEnabled) return ''

  const ref = (comp.bindings as any)?.loopItems
  if (typeof ref !== 'string' || !ref) {
    return '启用循环渲染后，需要将“数组数据”绑定到一个数组类型的数据源。'
  }

  const resolved = resolveBindingRef(ref, {
    getVarValue: (name) => pageStore.getVariableValue(name),
    getCompProp: (componentId, propKey) => pageStore.getComponentById(componentId)?.props?.[propKey],
    context: bindingContextForValidation.value
  })

  if (!Array.isArray(resolved)) {
    return '“数组数据”当前绑定的值不是数组，请改为绑定数组类型变量/上下文数据。'
  }

  return ''
})

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

// Flow 相关
const flows = computed(() => currentPage.value?.flows || []);
const flowOptions = computed(() => [
  { label: '不绑定', value: '' },
  ...flows.value.map(f => ({ label: f.name, value: f.id }))
]);

function openFlowEditor(flowId?: string) {
  emit('open-flow-editor', flowId);
}

function getFlowForEvent(eventName: string): string | undefined {
  if (!props.component || !props.component.events) return undefined;
  const event = props.component.events[eventName];
  if (Array.isArray(event)) {
    const handler = event.find(e => e.trigger === eventName);
    return handler?.flowId;
  }
  return undefined;
}

function updateEventFlow(eventName: string, flowId: string | null) {
  if (!props.component) return;
  
  const newEvents = { ...(props.component.events || {}) };
  
  if (!newEvents[eventName]) {
    newEvents[eventName] = [{ trigger: eventName, actions: [] }];
  }
  
  const handler = newEvents[eventName].find(e => e.trigger === eventName);
  if (!handler) {
    newEvents[eventName].push({ trigger: eventName, actions: [] });
  }
  
  const targetHandler = newEvents[eventName].find(e => e.trigger === eventName)!;
  // NaiveUI clearable 会回传 null；并且我们用 '' 表示不绑定
  const normalized = flowId === null || flowId === '' ? undefined : flowId;
  targetHandler.flowId = normalized;
  
  emit('update', {
    id: props.component.id,
    type: props.component.type,
    events: newEvents
  });
}

// 事件相关
const supportedEvents = computed(() => naiveConfig.value?.events || []);

// 动作编辑状态
const showActionModal = ref(false);
const currentEventName = ref('');
const editingActionIndex = ref(-1);
const currentAction = ref<CompEventAction>({ id: '', type: 'setVar', params: {} });

const actionTypeOptions = actionRegistry.map(a => ({ label: a.label, value: a.type }));
const currentActionDef = computed(() => actionRegistry.find(a => a.type === currentAction.value.type));

const variableOptions = computed(() => {
  return (pageStore.currentPage?.variables || []).map(v => ({ label: v.name, value: v.name }));
});

function getActionsForEvent(eventName: string) {
  if (!props.component || !props.component.events) return [];
  const event = props.component.events[eventName];
  
  if (Array.isArray(event)) {
    const handler = event.find(e => e.trigger === eventName);
    return handler ? handler.actions : [];
  }
  return [];
}

function getActionLabel(type: string) {
  return actionRegistry.find(a => a.type === type)?.label || type;
}

function getActionDesc(action: CompEventAction) {
  if (action.type === 'setVar') return `${action.params.variableName} = ${action.params.value}`;
  if (action.type === 'pushVar') return `Push to ${action.params.variableName}`;
  if (action.type === 'toast') return `Toast: ${action.params.content}`;
  return JSON.stringify(action.params);
}

function addEventAction(eventName: string) {
  currentEventName.value = eventName;
  editingActionIndex.value = -1;
  currentAction.value = { id: Date.now().toString(), type: 'setVar', params: {} };
  handleActionTypeChange('setVar');
  showActionModal.value = true;
}

function editAction(eventName: string, index: number) {
  currentEventName.value = eventName;
  editingActionIndex.value = index;
  const actions = getActionsForEvent(eventName);
  if (actions[index]) {
    currentAction.value = JSON.parse(JSON.stringify(actions[index]));
  }
  showActionModal.value = true;
}

function handleActionTypeChange(type: string) {
  const def = actionRegistry.find(a => a.type === type);
  const newParams: Record<string, any> = {};
  if (def) {
    Object.keys(def.paramsSchema).forEach(key => {
      if (key === 'valueType') newParams[key] = 'string';
    });
  }
  currentAction.value.params = newParams;
}

function saveAction() {
  if (!props.component) return;
  
  const eventName = currentEventName.value;
  const newEvents = { ...(props.component.events || {}) };
  
  if (!newEvents[eventName]) {
    newEvents[eventName] = [{ trigger: eventName, actions: [] }];
  }
  
  const handler = newEvents[eventName].find(e => e.trigger === eventName);
  if (!handler) {
    newEvents[eventName].push({ trigger: eventName, actions: [] });
  }
  
  const targetHandler = newEvents[eventName].find(e => e.trigger === eventName)!;
  
  if (editingActionIndex.value === -1) {
    targetHandler.actions.push({ ...currentAction.value });
  } else {
    targetHandler.actions[editingActionIndex.value] = { ...currentAction.value };
  }
  
  emit('update', {
    id: props.component.id,
    type: props.component.type,
    events: newEvents
  });
  
  showActionModal.value = false;
}

function removeAction(eventName: string, index: number) {
  if (!props.component) return;
  
  const newEvents = { ...(props.component.events || {}) };
  const handler = newEvents[eventName]?.find(e => e.trigger === eventName);
  
  if (handler) {
    handler.actions.splice(index, 1);
    emit('update', {
      id: props.component.id,
      type: props.component.type,
      events: newEvents
    });
  }
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
  /* 不需要固定高度，让flex自动计算 */
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
}

/* Section样式 */
.section {
  margin-bottom: 8px;
}

.section-header {
  padding: 12px 12px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.section-content {
  padding: 0 12px 12px;
}

/* 空状态 */
.empty-tip {
  padding: 16px;
  text-align: center;
  font-size: 11px;
  color: #999;
}

/* 事件样式 */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.event-item {
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  background: white;
  overflow: hidden;
}

.event-header {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9f9f9;
  border-bottom: 1px solid #eee;
}

.event-header span {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.action-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item {
  background: #fff;
  border-radius: 4px;
  padding: 8px 10px;
  border: 1px solid #eee;
  transition: all 0.2s;
}

.action-item:hover {
  border-color: #d9d9d9;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.action-type {
  font-size: 12px;
  font-weight: 600;
  color: #1890ff;
}

.action-tools {
  display: flex;
  gap: 4px;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.action-item:hover .action-tools {
  opacity: 1;
}

.action-desc {
  font-size: 11px;
  color: #666;
  word-break: break-all;
  line-height: 1.4;
}

.no-actions {
  padding: 16px;
  text-align: center;
  font-size: 11px;
  color: #999;
  background: #fff;
}

/* 渲染配置样式（与DynamicProperties一致） */
.dynamic-properties {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}

.property-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.prop-label {
  width: 100px;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bind-badge {
  font-size: 11px;
  color: #999;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.input-wrapper {
  flex: 1;
  display: flex;
  min-width: 0;
}

.bound-placeholder {
  width: 100%;
  height: 28px;
  border: 1px dashed #e5e5e5;
  border-radius: 4px;
  padding: 0 8px;
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
}

.bind-btn {
  flex: 0 0 auto;
}

.loop-warning {
  padding: 8px;
  font-size: 11px;
  color: #ad4e00;
  background: #fff7e6;
  border: 1px solid #ffe7ba;
  border-radius: 6px;
  margin: 0 12px 12px;
}
</style>
