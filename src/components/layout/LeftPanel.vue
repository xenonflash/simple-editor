<template>
  <div class="left-panel">
    <n-tabs type="segment" class="main-tabs" animated>
      <n-tab-pane name="page" tab="页面">
        <div class="page-tab-content">
          <div class="page-tab-half">
            <div class="tree-content">
              <div class="tree-title">{{ isCustomEditMode ? '子组件' : '组件树' }}</div>
              <n-tree
                block-line
                :data="componentTreeData"
                :selected-keys="selectedTreeKeys"
                :multiple="true"
                default-expand-all
                @update:selected-keys="handleTreeSelect"
              />
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
      </n-tab-pane>

      <n-tab-pane name="components" tab="组件">
        <div class="scroll-content">
          <n-collapse accordion v-model:expanded-names="componentsPanelExpanded">
            <n-collapse-item name="base" title="基础组件">
              <div class="component-list">
                <div class="component-item"
                     draggable="true"
                     @dragstart="handleDragStart(CompType.CONTAINER)">
                  <div class="icon">
                    <AppIcon name="box" />
                  </div>
                  <div class="name">容器</div>
                </div>
                <div class="component-item"
                     draggable="true"
                     @dragstart="handleDragStart(CompType.TEXT)">
                  <div class="icon">
                    <AppIcon name="file-alt" />
                  </div>
                  <div class="name">文字</div>
                </div>
                <div class="component-item"
                     draggable="true"
                     @dragstart="handleDragStart(CompType.BUTTON)">
                  <div class="icon">
                    <AppIcon name="circle" />
                  </div>
                  <div class="name">按钮</div>
                </div>
              </div>
            </n-collapse-item>

            <n-collapse-item name="naive" title="Naive UI 组件">
              <div class="component-list">
                <div v-for="item in naiveComponentRegistry"
                     :key="item.type"
                     class="component-item"
                     draggable="true"
                     @dragstart="handleDragStart(item.type)">
                  <div class="icon">
                    <AppIcon :name="item.icon" />
                  </div>
                  <div class="name">{{ item.name }}</div>
                </div>
              </div>
            </n-collapse-item>

            <n-collapse-item name="custom" title="自定义组件">
              <div class="component-list">
                <div v-for="item in customComponentDefs"
                     :key="item.id"
                     class="component-item custom-item">
                  <div class="custom-drag"
                       draggable="true"
                       @dragstart="handleCustomDragStart(item.id)">
                    <div class="icon">
                      <AppIcon name="box" />
                    </div>
                    <div class="name">{{ item.name }}</div>
                  </div>
                  <n-button size="tiny" quaternary circle class="custom-edit-btn" title="编辑组件" @click.stop="emit('edit-custom-component', item.id)">
                    <template #icon><n-icon><Create /></n-icon></template>
                  </n-button>
                  <n-popconfirm @positive-click="handleDeleteCustomComponent(item.id)" :positive-text="'删除'" :negative-text="'取消'">
                    <template #trigger>
                      <n-button size="tiny" quaternary circle type="error" class="custom-delete-btn" title="删除组件" @click.stop>
                        <template #icon><n-icon><Trash /></n-icon></template>
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
      </n-tab-pane>
      
      <n-tab-pane name="variables" :tab="isCustomEditMode ? '数据' : '变量'">
        <div v-if="!isCustomEditMode" class="variables-content">
          <div class="var-header">
            <n-button block dashed @click="startAddVariable">
              <template #icon><n-icon><Add /></n-icon></template>
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
                  <template #icon><n-icon><Create /></n-icon></template>
                </n-button>
                <n-popconfirm @positive-click="deleteVariable(v.name)">
                  <template #trigger>
                    <n-button size="tiny" quaternary circle type="error">
                      <template #icon><n-icon><Trash /></n-icon></template>
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
          <n-tabs type="segment" size="small" animated>
            <n-tab-pane name="props" tab="Props">
              <div class="var-header">
                <n-button block dashed @click="startAddSchema('props')">
                  <template #icon><n-icon><Add /></n-icon></template>
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
                      <template #icon><n-icon><Create /></n-icon></template>
                    </n-button>
                    <n-popconfirm @positive-click="removePropSchema(item.key)">
                      <template #trigger>
                        <n-button size="tiny" quaternary circle type="error" @click.stop>
                          <template #icon><n-icon><Trash /></n-icon></template>
                        </n-button>
                      </template>
                      确定删除参数 {{ item.key }}?
                    </n-popconfirm>
                  </div>
                </div>
                <div v-if="propSchemaEntries.length === 0" class="empty-tip">
                  暂未定义 Props（实例侧将不显示任何组件参数）
                </div>
              </div>
            </n-tab-pane>

            <n-tab-pane name="state" tab="State">
              <div class="var-header">
                <n-button block dashed @click="startAddSchema('state')">
                  <template #icon><n-icon><Add /></n-icon></template>
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
                      <template #icon><n-icon><Create /></n-icon></template>
                    </n-button>
                    <n-popconfirm @positive-click="removeStateSchema(item.key)">
                      <template #trigger>
                        <n-button size="tiny" quaternary circle type="error" @click.stop>
                          <template #icon><n-icon><Trash /></n-icon></template>
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
            </n-tab-pane>
          </n-tabs>
        </div>
      </n-tab-pane>

      <n-tab-pane name="flows" tab="逻辑">
        <div class="variables-content">
          <div class="var-header">
            <n-button block dashed @click="startAddFlow">
              <template #icon><n-icon><Add /></n-icon></template>
              添加逻辑流
            </n-button>
          </div>

          <div class="var-list">
            <div v-for="flow in flows" :key="flow.id" class="var-item" @click="openFlow(flow.id)" style="cursor: pointer">
              <div class="var-info">
                <div class="var-name" style="display: flex; align-items: center; gap: 6px;">
                  <n-icon><GitNetwork /></n-icon>
                  {{ flow.name }}
                </div>
              </div>
              <div class="var-actions">
                <n-button size="tiny" quaternary circle @click.stop="openFlow(flow.id)">
                  <template #icon><n-icon><Create /></n-icon></template>
                </n-button>
                <n-popconfirm @positive-click="deleteFlow(flow.id)">
                  <template #trigger>
                    <n-button size="tiny" quaternary circle type="error" @click.stop>
                      <template #icon><n-icon><Trash /></n-icon></template>
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
      </n-tab-pane>
    </n-tabs>

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
    <n-modal v-model:show="showSchemaModal" preset="dialog" :title="schemaEditingKey ? '编辑' + (schemaEditingKind === 'props' ? '参数' : '状态') : '添加' + (schemaEditingKind === 'props' ? '参数' : '状态')">
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

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  NTabs, NTabPane, NButton, NInput, NSelect, 
  NSpace, NTag, NPopconfirm, NIcon, NForm, NFormItem, NModal,
  NTree,
  NList, NListItem,
  NCollapse, NCollapseItem,
  useMessage
} from 'naive-ui';
import { Add, Trash, Create, Save, Close, GitNetwork } from '@vicons/ionicons5';
import type { Comp } from '../comps/base'
import { CompType } from '../comps/base';
import PageManagerVertical from './PageManagerVertical.vue';
import { naiveComponentRegistry } from '../../config/naive-ui-registry';
import { usePageStore } from '../../stores/page';
import { useCustomComponentsStore } from '../../stores/customComponents'
import type { PageVariable, PageFlow } from '../../types/page';
import type { PropSchema } from '../../config/naive-ui-registry'

const emit = defineEmits<{
  (e: 'open-flow-editor', flowId?: string): void
  (e: 'edit-custom-component', defId: string): void
  (e: 'update-custom-props-schema', schema: Record<string, PropSchema>): void
  (e: 'update-custom-state-schema', schema: Record<string, PropSchema>): void
}>()

const props = defineProps<{
  editingCustomDefName?: string | null
  editingCustomPropsSchema?: Record<string, PropSchema> | null
  editingCustomStateSchema?: Record<string, PropSchema> | null
}>()

const pageStore = usePageStore();
const customComponentsStore = useCustomComponentsStore()
const message = useMessage()
const isCustomEditMode = computed(() => pageStore.editorMode === 'custom-edit')
const currentPage = computed(() => pageStore.currentPage);
const variables = computed(() => currentPage.value?.variables || []);
const flows = computed(() => currentPage.value?.flows || []);

const componentsPanelExpanded = ref<string | null>('base');

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

function getAllPagesSafe(): any[] {
  const p: any = (pageStore as any).pages
  return Array.isArray(p) ? p : (Array.isArray(p?.value) ? p.value : [])
}

function pageHasCustomComponentRef(page: any, defId: string): boolean {
  const roots: any[] = Array.isArray(page?.components) ? page.components : []
  const stack: any[] = [...roots]
  while (stack.length) {
    const cur = stack.pop()
    const props: any = cur?.props || {}
    if (props.__customComponentId === defId) return true
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
  children?: ComponentTreeNode[]
}

function getComponentLabel(comp: Comp): string {
  if (comp.type === CompType.CONTAINER) return '容器'
  if (comp.type === CompType.TEXT) return '文字'
  if (comp.type === CompType.BUTTON) return '按钮'
  if (typeof comp.type === 'string' && comp.type.startsWith('n-')) {
    const hit = naiveComponentRegistry.find((x) => x.type === comp.type)
    return hit?.name || comp.type
  }
  return String(comp.type)
}

function buildTreeNode(comp: Comp): ComponentTreeNode {
  const children = (comp.children || []).map(buildTreeNode)
  const node: ComponentTreeNode = {
    key: comp.id,
    label: getComponentLabel(comp)
  }
  if (children.length > 0) node.children = children
  return node
}

const componentTreeData = computed<ComponentTreeNode[]>(() => {
  const roots = currentPage.value?.components || []
  return roots.map(buildTreeNode)
})

const selectedTreeKeys = computed(() => pageStore.selectedComps.map((c) => c.id))

function handleTreeSelect(keys: Array<string | number>, options: any) {
  const lastKey = keys[keys.length - 1]
  const lastNode = Array.isArray(options) ? options[options.length - 1] : options
  const isLeaf = !lastNode?.children || lastNode.children.length === 0
  if (isLeaf && typeof lastKey === 'string') {
    pageStore.selectComponent(lastKey)
  }
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

function handleDragStart(type: CompType) {
  // 设置拖拽数据
  const event = window.event as DragEvent;
  if (event.dataTransfer) {
    event.dataTransfer.setData('componentType', type);
    event.dataTransfer.effectAllowed = 'copy';
  }
}

function handleCustomDragStart(customComponentId: string) {
  const event = window.event as DragEvent
  if (event.dataTransfer) {
    event.dataTransfer.setData('customComponentId', customComponentId)
    event.dataTransfer.effectAllowed = 'copy'
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
  width: 300px;
  height: 100vh; /* 使用视口高度 */
  max-height: 100vh; /* 限制最大高度 */
  border-right: 1px solid #f0f0f0;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止溢出 */
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
/* 自定义滚动条样式 */
.scroll-content::-webkit-scrollbar,
.variables-content::-webkit-scrollbar,
.tree-content::-webkit-scrollbar {
  width: 6px;
}

.scroll-content::-webkit-scrollbar-thumb,
.variables-content::-webkit-scrollbar-thumb,
.tree-content::-webkit-scrollbar-thumb {
  background-color: #e0e0e0;
  border-radius: 3px;
}

.scroll-content::-webkit-scrollbar-track,
.variables-content::-webkit-scrollbar-track,
.tree-content::-webkit-scrollbar-track {
  background-color: transparent;
}

.component-list {
  padding: 0 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.component-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 4px;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease;
  background: white;
  border: 1px solid #e8e8e8;
  min-height: 56px;
}

.component-item:hover {
  background: #f5f5f5;
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
}

.component-item:active {
  cursor: grabbing;
  transform: translateY(0);
}

.icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-item {
  cursor: default;
  flex-direction: row;
  justify-content: space-between;
}

.custom-drag {
  display: flex;
  align-items: center;
  gap: 8px;
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

.tree-title {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
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

/* Tabs Styles */
.main-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.n-tabs-pane-wrapper) {
  flex: 1;
  overflow: hidden;
}

:deep(.n-tab-pane) {
  height: 100%;
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Variables Styles */
.variables-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.tree-content {
  height: 100%;
  overflow-y: auto;
  padding: 12px;
}

.page-tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.page-tab-half {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.page-tab-divider {
  height: 1px;
  background: #f0f0f0;
}

.page-manager-wrap {
  height: 100%;
  overflow: hidden;
}

.var-header {
  margin-bottom: 12px;
}

.var-form {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #eee;
}

.var-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.var-item:hover {
  background: #f5f5f5;
}

.var-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.var-name {
  font-weight: 500;
  font-size: 13px;
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
  padding: 20px 0;
  font-size: 12px;
}
</style>
