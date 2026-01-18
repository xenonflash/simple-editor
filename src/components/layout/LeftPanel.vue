<template>
  <div class="left-panel">
    <!-- 主标签页导航 -->
    <div class="tabs">
      <button class="tab-button" :class="{ active: activeMainTab === 'page' }" @click="activeMainTab = 'page'">
        页面
      </button>
      <button class="tab-button" :class="{ active: activeMainTab === 'components' }"
        @click="activeMainTab = 'components'">
        组件
      </button>
      <button class="tab-button" :class="{ active: activeMainTab === 'variables' }"
        @click="activeMainTab = 'variables'">
        {{ isCustomEditMode ? '数据' : '变量' }}
      </button>
      <button class="tab-button" :class="{ active: activeMainTab === 'flows' }" @click="activeMainTab = 'flows'">
        逻辑
      </button>
    </div>

    <!-- 标签页内容区域 -->
    <div class="tab-content">
      <!-- 页面 Tab -->
      <div v-show="activeMainTab === 'page'" class="tab-pane-content">
        <div class="page-tab-content">
          <div class="page-tab-half">
            <div class="tree-content">
              <div class="section-title">{{ isCustomEditMode ? '子组件' : '组件树' }}</div>
              <n-tree block-line draggable :data="componentTreeData" :selected-keys="selectedTreeKeys"
                default-expand-all @update:selected-keys="handleTreeSelect" @drop="handleTreeDrop" />
              <div v-if="componentTreeData.length === 0" class="empty-tip">
                暂无组件
              </div>
            </div>
          </div>

          <template v-if="!isCustomEditMode">
            <div class="page-tab-divider" />

            <div class="page-tab-half">
              <div class="page-manager-wrap">
                <PageManagerVertical />
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 组件 Tab -->
      <div v-show="activeMainTab === 'components'" class="tab-pane-content">
        <div class="scroll-content">
          <n-collapse accordion v-model:expanded-names="componentsPanelExpanded">
            <n-collapse-item name="base" title="基础组件">
              <div class="component-list">
                <div class="component-item" draggable="true" @dragstart="handleDragStart(CompType.CONTAINER, $event)">
                  <div class="icon">
                    <AppIcon name="box" />
                  </div>
                  <div class="name">容器</div>
                </div>
                <div class="component-item" draggable="true" @dragstart="handleDragStart(CompType.LIST, $event)">
                  <div class="icon">
                     <AppIcon name="list" />
                  </div>
                  <div class="name">列表</div>
                </div>
                <div class="component-item" draggable="true" @dragstart="handleDragStart(CompType.TEXT, $event)">
                  <div class="icon">
                    <AppIcon name="file-alt" />
                  </div>
                  <div class="name">文字</div>
                </div>
                <div class="component-item" draggable="true" @dragstart="handleDragStart(CompType.BUTTON, $event)">
                  <div class="icon">
                    <AppIcon name="circle" />
                  </div>
                  <div class="name">按钮</div>
                </div>
              </div>
            </n-collapse-item>

            <n-collapse-item name="naive" title="Naive UI 组件">
              <div class="component-list">
                <div v-for="item in naiveComponentRegistry" :key="item.type" class="component-item" draggable="true"
                  @dragstart="handleDragStart(item.type, $event)">
                  <div class="icon">
                    <AppIcon :name="item.icon" />
                  </div>
                  <div class="name">{{ item.name }}</div>
                </div>
              </div>
            </n-collapse-item>

            <n-collapse-item name="custom" title="自定义组件">
              <div class="component-list">
                <div v-for="item in customComponentDefs" :key="item.id" class="component-item custom-item">
                  <div class="custom-drag" draggable="true" @dragstart="handleCustomDragStart(item.id, $event)">
                    <div class="icon">
                      <AppIcon name="box" />
                    </div>
                    <div class="name">{{ item.name }}</div>
                  </div>
                  <n-button size="tiny" quaternary circle class="custom-edit-btn" title="编辑组件"
                    @click.stop="emit('edit-custom-component', item.id)">
                    <template #icon><n-icon>
                        <Create />
                      </n-icon></template>
                  </n-button>
                  <n-popconfirm @positive-click="handleDeleteCustomComponent(item.id)" :positive-text="'删除'"
                    :negative-text="'取消'">
                    <template #trigger>
                      <n-button size="tiny" quaternary circle type="error" class="custom-delete-btn" title="删除组件"
                        @click.stop>
                        <template #icon><n-icon>
                            <Trash />
                          </n-icon></template>
                      </n-button>
                    </template>
                    确定删除组件 {{ item.name }}?
                  </n-popconfirm>
                </div>
              </div>
              <div v-if="customComponentDefs.length === 0" class="empty-tip" style="padding: 12px 0;">暂无自定义组件</div>
            </n-collapse-item>
          </n-collapse>
        </div>
      </div>

      <!-- 变量/数据 Tab -->
      <div v-show="activeMainTab === 'variables'" class="tab-pane-content">
        <div v-if="!isCustomEditMode" class="variables-content">
          <div class="var-header">
            <n-button block dashed size="small" @click="startAddVariable">
              <template #icon><n-icon>
                  <Add />
                </n-icon></template>
              添加变量
            </n-button>
          </div>

          <!-- 变量列表 -->
          <div class="var-list">
            <div v-for="v in variables" :key="v.name" class="var-item">
              <div class="var-info">
                <div class="var-name">{{ v.name }}</div>
                <n-tag size="small" :bordered="false">{{ v.type }}</n-tag>
              </div>
              <div class="var-actions">
                <n-button size="tiny" quaternary circle @click="startEditVariable(v)">
                  <template #icon><n-icon>
                      <Create />
                    </n-icon></template>
                </n-button>
                <n-popconfirm @positive-click="deleteVariable(v.name)">
                  <template #trigger>
                    <n-button size="tiny" quaternary circle type="error">
                      <template #icon><n-icon>
                          <Trash />
                        </n-icon></template>
                    </n-button>
                  </template>
                  确定删除变量 {{ v.name }}?
                </n-popconfirm>
              </div>
            </div>
            <div v-if="variables.length === 0" class="empty-tip">
              暂无变量
            </div>
          </div>
        </div>

        <div v-else class="variables-content">
          <!-- 自定义组件数据子标签页 -->
          <div class="sub-tabs">
            <button class="sub-tab-button" :class="{ active: activeDataTab === 'props' }"
              @click="activeDataTab = 'props'">
              Props
            </button>
            <button class="sub-tab-button" :class="{ active: activeDataTab === 'state' }"
              @click="activeDataTab = 'state'">
              State
            </button>
            <button class="sub-tab-button" :class="{ active: activeDataTab === 'events' }"
              @click="activeDataTab = 'events'">
              Events
            </button>
          </div>

          <div class="sub-tab-content">
            <div v-show="activeDataTab === 'props'">
              <div class="var-header">
                <n-button block dashed size="small" @click="startAddSchema('props')">
                  <template #icon><n-icon>
                      <Add />
                    </n-icon></template>
                  添加参数
                </n-button>
              </div>

              <div class="var-list">
                <div v-for="item in propSchemaEntries" :key="item.key" class="var-item">
                  <div class="var-info">
                    <div class="var-name" :title="item.key">{{ item.key }}</div>
                    <n-tag size="small" :bordered="false">{{ getSchemaTypeLabel(item.schema.type) }}</n-tag>
                  </div>
                  <div class="var-actions">
                    <n-button size="tiny" quaternary circle @click.stop="startEditSchema('props', item.key)">
                      <template #icon><n-icon>
                          <Create />
                        </n-icon></template>
                    </n-button>
                    <n-popconfirm @positive-click="removePropSchema(item.key)">
                      <template #trigger>
                        <n-button size="tiny" quaternary circle type="error" @click.stop>
                          <template #icon><n-icon>
                              <Trash />
                            </n-icon></template>
                        </n-button>
                      </template>
                      确定删除参数 {{ item.key }}?
                    </n-popconfirm>
                  </div>
                </div>
                <div v-if="propSchemaEntries.length === 0" class="empty-tip">
                  暂未定义 Props
                </div>
              </div>
            </div>

            <div v-show="activeDataTab === 'state'">
              <div class="var-header">
                <n-button block dashed size="small" @click="startAddSchema('state')">
                  <template #icon><n-icon>
                      <Add />
                    </n-icon></template>
                  添加状态
                </n-button>
              </div>

              <div class="var-list">
                <div v-for="item in stateSchemaEntries" :key="item.key" class="var-item">
                  <div class="var-info">
                    <div class="var-name" :title="item.key">{{ item.key }}</div>
                    <n-tag size="small" :bordered="false">{{ getSchemaTypeLabel(item.schema.type) }}</n-tag>
                  </div>
                  <div class="var-actions">
                    <n-button size="tiny" quaternary circle @click.stop="startEditSchema('state', item.key)">
                      <template #icon><n-icon>
                          <Create />
                        </n-icon></template>
                    </n-button>
                    <n-popconfirm @positive-click="removeStateSchema(item.key)">
                      <template #trigger>
                        <n-button size="tiny" quaternary circle type="error" @click.stop>
                          <template #icon><n-icon>
                              <Trash />
                            </n-icon></template>
                        </n-button>
                      </template>
                      确定删除状态 {{ item.key }}?
                    </n-popconfirm>
                  </div>
                </div>
                <div v-if="stateSchemaEntries.length === 0" class="empty-tip">
                  暂未定义 State
                </div>
              </div>
            </div>

            <div v-show="activeDataTab === 'events'">
              <div class="var-header">
                <n-button block dashed size="small" @click="startAddEvent">
                  <template #icon><n-icon>
                      <Add />
                    </n-icon></template>
                  添加事件
                </n-button>
              </div>

              <div class="var-list">
                <div v-for="item in eventSchemaEntries" :key="item.key" class="var-item">
                  <div class="var-info">
                    <div class="var-name" :title="item.key">{{ item.key }}</div>
                    <n-tag size="small" :bordered="false">{{ item.spec.label }}</n-tag>
                  </div>
                  <div class="var-actions">
                    <n-button size="tiny" quaternary circle @click.stop="startEditEvent(item.key)">
                      <template #icon><n-icon>
                          <Create />
                        </n-icon></template>
                    </n-button>
                    <n-popconfirm @positive-click="removeEventSchema(item.key)">
                      <template #trigger>
                        <n-button size="tiny" quaternary circle type="error" @click.stop>
                          <template #icon><n-icon>
                              <Trash />
                            </n-icon></template>
                        </n-button>
                      </template>
                      确定删除事件 {{ item.key }}?
                    </n-popconfirm>
                  </div>
                </div>
                <div v-if="eventSchemaEntries.length === 0" class="empty-tip">
                  暂未定义 Events
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 逻辑(Flows) Tab -->
      <div v-show="activeMainTab === 'flows'" class="tab-pane-content">
        <div class="variables-content">
          <div class="var-header">
            <n-button block dashed size="small" @click="startAddFlow">
              <template #icon><n-icon>
                  <Add />
                </n-icon></template>
              添加逻辑流
            </n-button>
          </div>

          <div class="var-list">
            <div v-for="flow in flows" :key="flow.id" class="var-item" @click="openFlow(flow.id)"
              style="cursor: pointer">
              <div class="var-info">
                <div class="var-name" style="display: flex; align-items: center; gap: 6px;">
                  <n-icon>
                    <GitNetwork />
                  </n-icon>
                  {{ flow.name }}
                </div>
              </div>
              <div class="var-actions">
                <n-button size="tiny" quaternary circle @click.stop="openFlow(flow.id)">
                  <template #icon><n-icon>
                      <Create />
                    </n-icon></template>
                </n-button>
                <n-popconfirm @positive-click="deleteFlow(flow.id)">
                  <template #trigger>
                    <n-button size="tiny" quaternary circle type="error" @click.stop>
                      <template #icon><n-icon>
                          <Trash />
                        </n-icon></template>
                    </n-button>
                  </template>
                  确定删除逻辑流 {{ flow.name }}?
                </n-popconfirm>
              </div>
            </div>
            <div v-if="flows.length === 0" class="empty-tip">
              暂无逻辑流
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 变量编辑弹窗 -->
    <n-modal v-model:show="showModal" preset="dialog" :title="editingName ? '编辑变量' : '添加变量'">
      <n-form size="small" label-placement="left" label-width="60">
        <n-form-item label="变量名">
          <n-input v-model:value="formValue.name" placeholder="例如: todos" />
        </n-form-item>
        <n-form-item label="类型">
          <n-select v-model:value="formValue.type" :options="typeOptions" />
        </n-form-item>
        <n-form-item label="默认值">
          <n-input v-model:value="formValue.defaultValue" type="textarea" placeholder="JSON格式" :rows="5" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button size="small" @click="cancelEdit">取消</n-button>
        <n-button size="small" type="primary" @click="saveVariable">保存</n-button>
      </template>
    </n-modal>

    <!-- 逻辑流创建弹窗 -->
    <n-modal v-model:show="showFlowModal" preset="dialog" title="新建逻辑流">
      <n-form size="small">
        <n-form-item label="名称">
          <n-input v-model:value="newFlowName" placeholder="例如: 提交表单" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button size="small" @click="showFlowModal = false">取消</n-button>
        <n-button size="small" type="primary" @click="createFlow">创建</n-button>
      </template>
    </n-modal>

    <!-- Schema 编辑弹窗（Props/State） -->
    <n-modal v-model:show="showSchemaModal" preset="dialog"
      :title="schemaEditingKey ? '编辑' + (schemaEditingKind === 'props' ? '参数' : '状态') : '添加' + (schemaEditingKind === 'props' ? '参数' : '状态')">
      <n-form size="small" label-placement="left" label-width="70">
        <n-form-item label="Key">
          <n-input v-model:value="schemaForm.key" :disabled="!!schemaEditingKey" placeholder="例如: title" />
        </n-form-item>
        <n-form-item label="展示名">
          <n-input v-model:value="schemaForm.label" placeholder="例如: 标题" />
        </n-form-item>
        <n-form-item label="类型">
          <n-select v-model:value="schemaForm.type" :options="schemaTypeOptions" />
        </n-form-item>
        <n-form-item label="默认值">
          <n-input v-model:value="schemaForm.defaultValue" type="textarea" :rows="3" placeholder="文本/JSON" />
        </n-form-item>
      </n-form>

      <template #action>
        <n-button size="small" @click="showSchemaModal = false">取消</n-button>
        <n-button size="small" type="primary" @click="saveSchema">保存</n-button>
      </template>
    </n-modal>

    <!-- 事件定义 Modal -->
    <n-modal v-model:show="showEventModal" preset="dialog" :title="eventEditingKey ? '编辑事件' : '添加事件'">
      <n-form size="small" label-placement="left" label-width="70">
        <n-form-item label="事件名" path="key">
          <n-input v-model:value="eventForm.key" :disabled="!!eventEditingKey" placeholder="例如: success" />
        </n-form-item>
        <n-form-item label="展示名" path="label">
          <n-input v-model:value="eventForm.label" placeholder="例如: 提交成功" />
        </n-form-item>
        <n-form-item label="分类" path="category">
          <n-select v-model:value="eventForm.category" :options="[
            { label: '交互', value: 'interaction' },
            { label: '表单', value: 'form' },
            { label: '生命周期', value: 'lifecycle' },
            { label: '业务', value: 'business' }
          ]" />
        </n-form-item>
        <n-form-item label="参数定义" path="args">
          <n-input v-model:value="eventForm.args" type="textarea" :rows="3"
            placeholder='JSON格式，例如: {"value": "number"}' />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button size="small" @click="showEventModal = false">取消</n-button>
        <n-button size="small" type="primary" @click="saveEvent">保存</n-button>
      </template>
    </n-modal>

  </div>
</template>

<script setup lang="ts">
import { h, type VNode, ref, computed } from 'vue'
import {
  NButton, NInput, NSelect, NIcon, NTag, NPopconfirm,
  NTree, NCollapse, NCollapseItem, NForm, NFormItem, NModal,
  type TreeOption, type TreeDropInfo, useMessage
} from 'naive-ui';
import {
  Add, Trash, Create, Save, Close, GitNetwork,
  CubeOutline, CubeSharp, Text, RadioButtonOn, Repeat
} from '@vicons/ionicons5';
import AppIcon from '../icons/AppIcon.vue'
import { CompType } from '../comps/base';
import type { Comp } from '../comps/base'
import PageManagerVertical from './PageManagerVertical.vue';
import { naiveComponentRegistry } from '../../config/naive-ui-registry';
import { usePageStore } from '../../stores/page';
import { useCustomComponentsStore } from '../../stores/customComponents'
import type { PageVariable, PageFlow } from '../../types/page';
import type { PropSchema } from '../../config/naive-ui-registry'
import type { EventSpec } from '../../types/event'
import { resolveBindingRef } from '../../utils/bindingRef'
import { EventType } from '../../types/event'

const emit = defineEmits<{
  (e: 'open-flow-editor', flowId?: string): void
  (e: 'edit-custom-component', defId: string): void
  (e: 'update-custom-props-schema', schema: Record<string, PropSchema>): void
  (e: 'update-custom-state-schema', schema: Record<string, PropSchema>): void
  (e: 'update-custom-events-schema', schema: Record<string, EventSpec>): void
}>()

const props = defineProps<{
  editingCustomDefName?: string | null
  editingCustomPropsSchema?: Record<string, PropSchema> | null
  editingCustomStateSchema?: Record<string, PropSchema> | null
  editingCustomEventsSchema?: Record<string, EventSpec> | null
}>()

const pageStore = usePageStore();
const customComponentsStore = useCustomComponentsStore()
const message = useMessage()
const isCustomEditMode = computed(() => pageStore.editorMode === 'custom-edit')
const currentPage = computed(() => pageStore.currentPage);
const variables = computed(() => currentPage.value?.variables || []);
const flows = computed(() => currentPage.value?.flows || []);

const componentsPanelExpanded = ref<string | null>('base');

const activeMainTab = ref('page')
const activeDataTab = ref('props')


customComponentsStore.initializeFromLocalStorage()

const customComponentDefs = computed(() => customComponentsStore.defs)

const schemaTypeOptions = [
  { label: '文本', value: 'text' },
  { label: '数字', value: 'number' },
  { label: '布尔', value: 'boolean' },
  { label: '颜色', value: 'color' },
  { label: 'JSON', value: 'json' }
]

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

// Props schema editor
const propSchemaEntries = computed(() => {
  const schema = props.editingCustomPropsSchema || {}
  return Object.keys(schema)
    .sort()
    .map((k) => ({ key: k, schema: schema[k] }))
})

const newPropKey = ref('')
const newPropLabel = ref('')
const newPropType = ref<'text' | 'number' | 'boolean' | 'color' | 'json'>('text')
const newPropDefault = ref('')

function updatePropSchema(key: string, patch: Partial<PropSchema>) {
  const cur = (props.editingCustomPropsSchema || {})
  const prev = cur[key]
  if (!prev) return
  const next: Record<string, PropSchema> = { ...cur }
  next[key] = { ...prev, ...patch }
  emit('update-custom-props-schema', next)
}

function removePropSchema(key: string) {
  const cur = (props.editingCustomPropsSchema || {})
  if (!(key in cur)) return
  const next: Record<string, PropSchema> = { ...cur }
  delete next[key]
  emit('update-custom-props-schema', next)
}

// State schema editor
const stateSchemaEntries = computed(() => {
  const schema = props.editingCustomStateSchema || {}
  return Object.keys(schema)
    .sort()
    .map((k) => ({ key: k, schema: schema[k] }))
})

const newStateKey = ref('')
const newStateLabel = ref('')
const newStateType = ref<'text' | 'number' | 'boolean' | 'color' | 'json'>('text')
const newStateDefault = ref('')

function getSchemaTypeLabel(type: string): string {
  const hit = schemaTypeOptions.find((x) => x.value === type)
  return hit?.label || type
}

const showSchemaModal = ref(false)
const schemaEditingKind = ref<'props' | 'state'>('props')
const schemaEditingKey = ref<string>('')

const schemaForm = ref<{ key: string; label: string; type: 'text' | 'number' | 'boolean' | 'color' | 'json'; defaultValue: string }>(
  { key: '', label: '', type: 'text', defaultValue: '' }
)

function startAddSchema(kind: 'props' | 'state') {
  schemaEditingKind.value = kind
  schemaEditingKey.value = ''
  schemaForm.value = { key: '', label: '', type: 'text', defaultValue: '' }
  showSchemaModal.value = true
}

function startEditSchema(kind: 'props' | 'state', key: string) {
  schemaEditingKind.value = kind
  schemaEditingKey.value = key
  const schema = kind === 'props' ? (props.editingCustomPropsSchema || {}) : (props.editingCustomStateSchema || {})
  const cur = schema[key]
  schemaForm.value = {
    key,
    label: String(cur?.label || key),
    type: (cur?.type as any) || 'text',
    defaultValue: (() => {
      const defv: any = cur && Object.prototype.hasOwnProperty.call(cur, 'default') ? (cur as any).default : ''
      if (typeof defv === 'string') return defv
      try {
        return JSON.stringify(defv)
      } catch {
        return String(defv ?? '')
      }
    })()
  }
  showSchemaModal.value = true
}

function saveSchema() {
  const kind = schemaEditingKind.value
  const editingKey = schemaEditingKey.value

  const key = (editingKey || schemaForm.value.key).trim()
  if (!key) return

  const label = schemaForm.value.label.trim() || key
  const type = schemaForm.value.type
  const parsedDefault = parseDefaultByType(type, schemaForm.value.defaultValue)

  if (kind === 'props') {
    const cur = props.editingCustomPropsSchema || {}
    if (!editingKey && key in cur) return
    const next: Record<string, PropSchema> = { ...cur }
    next[key] = { ...(next[key] || {}), label, type, default: parsedDefault }
    emit('update-custom-props-schema', next)
  } else {
    const cur = props.editingCustomStateSchema || {}
    if (!editingKey && key in cur) return
    const next: Record<string, PropSchema> = { ...cur }
    next[key] = { ...(next[key] || {}), label, type, default: parsedDefault }
    emit('update-custom-state-schema', next)
  }

  showSchemaModal.value = false
}

function updateStateSchema(key: string, patch: Partial<PropSchema>) {
  const cur = (props.editingCustomStateSchema || {})
  const prev = cur[key]
  if (!prev) return
  const next: Record<string, PropSchema> = { ...cur }
  next[key] = { ...prev, ...patch }
  emit('update-custom-state-schema', next)
}

function removeStateSchema(key: string) {
  const cur = (props.editingCustomStateSchema || {})
  if (!(key in cur)) return
  const next: Record<string, PropSchema> = { ...cur }
  delete next[key]
  emit('update-custom-state-schema', next)
}

// Event schema editor
const eventSchemaEntries = computed(() => {
  const schema = props.editingCustomEventsSchema || {}
  return Object.keys(schema)
    .sort()
    .map((k) => ({ key: k, spec: schema[k] }))
})

const showEventModal = ref(false)
const eventEditingKey = ref<string>('')
const eventForm = ref<{ key: string; label: string; category: string; args: string }>({
  key: '', label: '', category: 'interaction', args: '{}'
})

function startAddEvent() {
  eventEditingKey.value = ''
  eventForm.value = { key: '', label: '', category: 'interaction', args: '{}' }
  showEventModal.value = true
}

function startEditEvent(key: string) {
  eventEditingKey.value = key
  const schema = props.editingCustomEventsSchema || {}
  const cur = schema[key]
  eventForm.value = {
    key,
    label: cur?.label || key,
    category: cur?.category || 'interaction',
    args: cur?.args ? JSON.stringify(cur.args, null, 2) : '{}'
  }
  showEventModal.value = true
}

function removeEventSchema(key: string) {
  const cur = props.editingCustomEventsSchema || {}
  if (!(key in cur)) return

  // Check if used in any component in current page
  if (isCustomEditMode.value) {
    const pages = getAllPagesSafe()
    const currentPageId = pageStore.currentPageId
    const currentPage = pages.find((p) => p.id === currentPageId)

    if (currentPage && currentPage.components) {
      const usedInComponents: string[] = []
      const stack = [...currentPage.components]
      while (stack.length) {
        const comp = stack.pop()
        if (comp.events) {
          for (const evtName in comp.events) {
            const handlers = comp.events[evtName]
            if (Array.isArray(handlers)) {
              for (const h of handlers) {
                if (h.actions && h.actions.some((a: any) => a.type === 'emitEvent' && a.params?.eventName === key)) {
                  usedInComponents.push(comp.name || comp.id)
                }
              }
            }
          }
        }
        if (comp.children) stack.push(...comp.children)
      }

      if (usedInComponents.length > 0) {
        message.warning(`无法删除事件 "${key}"，因为它已被以下组件使用: ${usedInComponents.slice(0, 3).join(', ')}${usedInComponents.length > 3 ? '...' : ''}`)
        return
      }
    }
  }

  const next: Record<string, EventSpec> = { ...cur }
  delete next[key]
  emit('update-custom-events-schema', next)
}

function saveEvent() {
  const editingKey = eventEditingKey.value
  const key = (editingKey || eventForm.value.key).trim()
  if (!key) return

  const cur = props.editingCustomEventsSchema || {}
  if (!editingKey && key in cur) {
    message.error('事件名已存在')
    return
  }

  let parsedArgs: Record<string, string> | undefined = undefined
  try {
    const raw = eventForm.value.args.trim()
    if (raw) parsedArgs = JSON.parse(raw)
  } catch (e) {
    message.error('参数定义必须是合法的 JSON (例如 {"value": "number"})')
    return
  }

  const next: Record<string, EventSpec> = { ...cur }
  next[key] = {
    name: key,
    label: eventForm.value.label.trim() || key,
    category: eventForm.value.category as any || 'interaction',
    args: parsedArgs
  }
  delete (next[key] as any).id // clean up

  // if editing key changed, delete old
  if (editingKey && editingKey !== key) {
    delete next[editingKey]
  }

  emit('update-custom-events-schema', next)
  showEventModal.value = false
}

function getAllPagesSafe(): any[] {
  const p: any = (pageStore as any).pages
  return Array.isArray(p) ? p : (Array.isArray(p?.value) ? p.value : [])
}

function pageHasCustomComponentRef(page: any, defId: string): boolean {
  const roots: any[] = Array.isArray(page?.components) ? page.components : []
  const stack: any[] = [...roots]
  while (stack.length) {
    const cur = stack.pop()
    if (cur?.custom?.defId === defId) return true
    const children: any[] = Array.isArray(cur?.children) ? cur.children : []
    for (const ch of children) stack.push(ch)
  }
  return false
}

function handleDeleteCustomComponent(defId: string) {
  // 删除前先检查是否有页面引用（排除临时编辑页）
  const pages = getAllPagesSafe().filter((p) => !String(p?.id || '').startsWith('__cc_edit__:'))
  const hit = pages.find((p) => pageHasCustomComponentRef(p, defId))
  if (hit) {
    message.warning(`无法删除：页面「${hit?.name || hit?.id}」正在使用该组件`)
    return
  }

  const ok = customComponentsStore.deleteCustomComponent(defId)
  if (ok) message.success('已删除自定义组件')
}


type ComponentTreeNode = {
  key: string
  label: string
  prefix?: () => VNode
  children?: ComponentTreeNode[]
  isLeaf?: boolean
  disabled?: boolean
  comp?: Comp // for drag check
}

function resolveLoopItemsForTree(comp: Comp): any[] | null {
  const binding = comp.bindings?.['loopItems']
  let loopItems = null
  
  if (binding) {
    const bindingRef = resolveBindingRef(binding, {
      getVarValue: (name: string) => pageStore.getVariableValue(name),
      getCompProp: (compId: string, prop: string) => pageStore.getComponentById(compId)?.props?.[prop],
      context: undefined
    })
    
    // 1. 如果是变量绑定 (var:xxx)
    if (bindingRef && bindingRef.type === 'var') {
      const raw = pageStore.getVariableValue(bindingRef.varName)
      if (Array.isArray(raw)) loopItems = raw
    }
  }

  // 如果有数据，返回数据
  if (loopItems) return loopItems

  // 如果没有数据，检查 loopCount mock
  const loopCount = (comp.props as any)?.loopCount ?? 1
  if (loopCount > 1) {
    return Array.from({length: loopCount}, (_, i) => ({ _mockIndex: i }))
  }

  return null
}

function previewLoopItem(item: any): string {
  if (item === null || item === undefined) return 'null'
  if (typeof item === 'object') return JSON.stringify(item)
  return String(item)
}

function unwrapLoopInstanceKey(key: string): string {
  // key format: realId__loop__index or realId__loop__group
  if (key.includes('__loop__')) {
    return key.split('__loop__')[0]
  }
  return key
}

function getComponentLabel(comp: Comp): string {
  // 1. 如果有 custom.defId，说明是自定义组件实例 -> 显示组件名
  if (comp.custom?.defId) {
    const def = customComponentsStore.getById(comp.custom.defId)
    return def ? def.name : (comp.name || '自定义组件')
  }

  // 2. 如果 comp.name 被用户修改过（不等于默认 id），优先显示 name
  if (comp.name && comp.name !== comp.id) {
    return comp.name
  }

  // 3. 否则显示类型对应的中文名
  if (comp.type === CompType.CONTAINER) return '容器'
  if (comp.type === CompType.LIST) return '列表'
  if (comp.type === CompType.BUTTON) return '按钮'
  if (comp.type === CompType.TEXT) return '文字'
  if (String(comp.type).startsWith('n-')) {
    const hit = naiveComponentRegistry.find((x) => x.type === comp.type)
    return hit?.name || comp.type
  }
  return String(comp.type)
}

function getComponentIcon(comp: Comp) {
  // 自定义组件图标
  if (comp.custom?.defId) {
    return () => h(NIcon, { color: '#18a058' }, { default: () => h(CubeSharp) })
  }

  // 基础组件
  if (comp.type === CompType.CONTAINER) {
    return () => h(NIcon, null, { default: () => h(CubeOutline) })
  }
  if (comp.type === CompType.LIST) {
     return () => h(NIcon, null, { default: () => h(List) })
  }
  if (comp.type === CompType.TEXT) {
    return () => h(NIcon, null, { default: () => h(Text) })
  }
  if (comp.type === CompType.BUTTON) {
    return () => h(NIcon, null, { default: () => h(RadioButtonOn) })
  }

  // Naive UI 组件
  if (String(comp.type).startsWith('n-')) {
    const hit = naiveComponentRegistry.find((x) => x.type === comp.type)
    if (hit?.icon) {
      return () => h(AppIcon, { name: hit.icon, class: 'n-icon' })
    }
  }

  return undefined
}

function buildTreeNode(comp: Comp): ComponentTreeNode {
  const isCustom = !!comp.custom?.defId
  // 规则3：自定义组件不需要渲染内部子组件
  const children = isCustom
    ? []
    : (comp.children || []).map(buildTreeNode)

  const loopItems = resolveLoopItemsForTree(comp)
  const loopChildren: ComponentTreeNode[] = []

  // 只有非自定义组件才在树里显示循环展开（防止树太乱），或者也可以都显示
  // 这里暂时保持原逻辑，如果自定义组件有循环绑定，也显示出来
  if (loopItems) {
    const max = Math.min(loopItems.length, 50)
    for (let i = 0; i < max; i++) {
      loopChildren.push({
        key: `${comp.id}__loop__${i}`,
        label: `#${i} ${previewLoopItem(loopItems[i])}`,
        isLeaf: true
        // Allow selection
      })
    }
    if (loopItems.length > max) {
      loopChildren.push({
        key: `${comp.id}__loop__more`,
        label: `…还有 ${loopItems.length - max} 项`,
        isLeaf: true,
        disabled: true
      })
    }
  }

  const node: ComponentTreeNode = {
    key: comp.id,
    label: getComponentLabel(comp),
    prefix: getComponentIcon(comp),
    comp
  }

  // 显示循环信息：图标+数量
  if (loopItems && loopItems.length > 0) {
    node.suffix = () => h('span', { style: 'display: inline-flex; align-items: center; color: #18a058; font-size: 12px; margin-left: 4px;' }, [
      h(NIcon, { size: 14, style: 'margin-right: 2px;' }, { default: () => h(Repeat) }),
      loopItems.length
    ])
  }

  const mergedChildren: ComponentTreeNode[] = []
  if (loopChildren.length > 0) {
    // 平铺显示循环实例，去掉父节点
    mergedChildren.push(...loopChildren)
  }
  if (children.length > 0) mergedChildren.push(...children)
  if (mergedChildren.length > 0) node.children = mergedChildren
  else node.isLeaf = true // 没有子节点标记为叶子

  return node
}

const componentTreeData = computed<ComponentTreeNode[]>(() => {
  const roots = currentPage.value?.components || []
  return roots.map(buildTreeNode)
})

const selectedTreeKeys = computed(() => pageStore.selectedComps.map((c) => c.id))

function handleTreeSelect(keys: Array<string | number>, options: Array<TreeOption | null>) {
  // 支持多选，并将选中的 keys 传递给 store
  // 此时 keys 可能包含 loop 实例 ID (componentId__loop__N)
  const validKeys = keys.map(String).filter(k => !k.includes('__loop__group')) // 兼容旧逻辑防御

  if (validKeys.length === 0) {
    pageStore.selectComponent(null)
  } else {
    pageStore.selectComponents(validKeys)
  }
}

function handleTreeDrop(info: TreeDropInfo) {
  const { dragNode, node, dropPosition } = info
  const dragKey = String(dragNode.key)
  const targetKey = String(node.key)

  if (dragKey.includes('__loop__') || targetKey.includes('__loop__')) return

  // 移动组件
  // dropPosition: 'before' | 'inside' | 'after'

  // 1. 如果是 inside，则是移动到目标容器内
  if (dropPosition === 'inside') {
    // 检查目标是否是容器或列表
    const targetComp = (node as any).comp as Comp
    if (targetComp.type === CompType.CONTAINER || targetComp.type === CompType.LIST) {
      pageStore.moveComponent(dragKey, targetKey, 0)
    }
    return
  }

  // 2. 如果是 before/after，则是移动到目标节点的同级
  // 首先找到目标的父节点 ID
  const parentId = pageStore.findParentContainerId(targetKey)
  const targetComp = (node as any).comp as Comp

  // 需要计算目标在父容器中的 index
  let siblings: Comp[] = []
  if (!parentId) {
    siblings = currentPage.value?.components || []
  } else {
    const parent = pageStore.getComponentById(parentId)
    siblings = parent?.children || []
  }

  let targetIndex = siblings.findIndex(c => c.id === targetKey)
  if (targetIndex === -1) return

  // 如果是 after，插入索引加1
  if (dropPosition === 'after') {
    targetIndex++
  }

  pageStore.moveComponent(dragKey, parentId || null, targetIndex)
}


// Flow 操作
const showFlowModal = ref(false);
const newFlowName = ref('');

function startAddFlow() {
  showFlowModal.value = true;
  newFlowName.value = '';
}

function createFlow() {
  if (!newFlowName.value) return;
  const newFlow: PageFlow = {
    id: `flow_${Date.now()}`,
    name: newFlowName.value,
    nodes: [
      {
        id: 'start',
        type: 'logicStart',
        position: { x: 100, y: 100 },
        data: { label: '开始' }
      }
    ],
    edges: []
  };

  const updatedFlows = [...flows.value, newFlow];
  pageStore.updatePageProperties(currentPage.value!.id, { flows: updatedFlows });

  showFlowModal.value = false;
  emit('open-flow-editor', newFlow.id);
}

function deleteFlow(id: string) {
  const updatedFlows = flows.value.filter(f => f.id !== id);
  pageStore.updatePageProperties(currentPage.value!.id, { flows: updatedFlows });
}

function openFlow(id: string) {
  emit('open-flow-editor', id);
}

// 变量编辑状态
const showModal = ref(false);
const editingName = ref(''); // 如果是编辑现有变量，存储原名
const formValue = ref<PageVariable>({
  name: '',
  type: 'string',
  defaultValue: ''
});

const typeOptions = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔值', value: 'boolean' },
  { label: '数组', value: 'array' },
  { label: '对象', value: 'object' }
];

function handleDragStart(type: CompType, event?: DragEvent) {
  // 设置拖拽数据
  const e = event || (window.event as DragEvent);
  if (e && e.dataTransfer) {
    e.dataTransfer.setData('componentType', type);
    e.dataTransfer.effectAllowed = 'copy';
  }
}

function handleCustomDragStart(customComponentId: string, event?: DragEvent) {
  const e = event || (window.event as DragEvent);
  if (e && e.dataTransfer) {
    e.dataTransfer.setData('customComponentId', customComponentId)
    e.dataTransfer.effectAllowed = 'copy'
  }
}

// 变量操作
function startAddVariable() {
  showModal.value = true;
  editingName.value = '';
  formValue.value = { name: '', type: 'string', defaultValue: '' };
}

function startEditVariable(variable: PageVariable) {
  showModal.value = true;
  editingName.value = variable.name;
  // 复制一份，避免直接修改
  formValue.value = { ...variable };
  // 处理非字符串类型的默认值显示
  if (typeof formValue.value.defaultValue !== 'string') {
    formValue.value.defaultValue = JSON.stringify(formValue.value.defaultValue, null, 2);
  }
}

function cancelEdit() {
  showModal.value = false;
}

function saveVariable() {
  if (!formValue.value.name) return;

  const variableToSave: PageVariable = {
    ...formValue.value,
    defaultValue: parseDefaultValue(formValue.value.defaultValue, formValue.value.type)
  };

  if (editingName.value) {
    // 更新
    pageStore.updateVariable(editingName.value, variableToSave);
  } else {
    // 新增
    pageStore.addVariable(variableToSave);
  }
  showModal.value = false;
}

function deleteVariable(name: string) {
  pageStore.deleteVariable(name);
}

function parseDefaultValue(value: string, type: string) {
  if (type === 'number') return Number(value);
  if (type === 'boolean') return value === 'true';
  if (type === 'array' || type === 'object') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return type === 'array' ? [] : {};
    }
  }
  return value;
}
</script>

<style scoped>
.left-panel {
  width: 280px;
  height: 100%;
  border-right: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

/* Main Tabs - Segmented Control Style */
.tabs {
  margin: 12px 12px 8px;
  padding: 4px;
  background: #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
  height: auto;
  border-bottom: none;
}

.tab-button {
  flex: 1;
  height: 32px;
  border: none;
  background: none;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
  position: relative;
  font-weight: 500;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-button:hover {
  color: #334155;
  background: rgba(255,255,255,0.5);
}

.tab-button.active {
  color: #0f172a;
  background: #fff;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.tab-button.active::after {
  display: none;
}

/* Tab Content Area */
.tab-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tab-pane-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Scrollable Areas */
.scroll-content,
.tree-content,
.variables-content,
.page-manager-wrap {
  flex: 1;
  overflow-y: overlay;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #d9d9d9 transparent;
}

.tree-content {
  padding: 16px;
}

.scroll-content {
  padding: 0;
  /* Accordion inside handles padding */
}

/* Sub Tabs (Data/Variables) */
.sub-tabs {
  display: flex;
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  gap: 4px;
  background: #fff;
  flex-shrink: 0;
}

.sub-tab-button {
  background: none;
  border: none;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 4px;
  transition: all 0.2s;
}

.sub-tab-button:hover {
  background: #f5f5f5;
  color: #333;
}

.sub-tab-button.active {
  color: #000;
  background: #f0f0f0;
  font-weight: 500;
}

.sub-tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

/* Component Tree Section */
.section-title {
  font-size: 11px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

/* Layout for Page Tab */
.page-tab-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-tab-half {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.page-tab-divider {
  height: 1px;
  background: #e5e5e5;
  margin: 0;
  flex-shrink: 0;
}

/* Component Grid */
.component-list {
  padding: 12px 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fff;
  border: 1px solid transparent;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.06);
  min-height: 80px;
}

.component-item:hover {
  background: #fff;
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
}

.component-item:active {
  cursor: grabbing;
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.icon {
  width: 36px;
  height: 36px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 8px;
  color: #475569;
  transition: all 0.2s;
}

.component-item:hover .icon {
  background: #eff6ff;
  color: #3b82f6;
  transform: scale(1.05);
}

.custom-item {
  cursor: default;
  flex-direction: row;
  justify-content: space-between;
  padding: 8px 12px;
  min-height: 56px;
}

.custom-item .icon {
  margin-bottom: 0;
  width: 32px;
  height: 32px;
  margin-right: 12px;
}

.custom-drag {
  display: flex;
  align-items: center;
  /* gap: 8px; Removed gap since we use margin on icon */
  flex: 1;
  min-width: 0;
  cursor: grab;
}

.custom-edit-btn,
.custom-delete-btn {
  flex: 0 0 auto;
}

.custom-edit-btn {
  font-size: 16px;
  color: #666;
}

.data-header {
  padding: 2px 0 10px;
}

.data-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.data-subtitle {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.data-inner-tabs {
  margin-top: 6px;
}

.data-section {
  padding-top: 8px;
}

.data-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.schema-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
}

.schema-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.schema-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.schema-key {
  width: 90px;
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schema-label {
  flex: 1;
  min-width: 0;
}

.schema-type {
  width: 110px;
  flex: 0 0 auto;
}

.schema-empty {
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}

.name {
  font-size: 12px;
  color: inherit;
  font-weight: 500;
  text-align: center;
}

/* Variable/Data Items */
.variables-content {
  padding: 16px;
}

.var-header {
  margin-bottom: 16px;
}

.var-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  /* List style */
}

.var-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.var-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.var-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.var-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.var-item:hover .var-actions {
  opacity: 1;
}

.empty-tip {
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 24px 0;
}

/* Scrollbars */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

::-webkit-scrollbar-track {
  background: transparent;
  font-size: 12px;
}
</style>
