<template>
  <div class="left-panel">
    <n-tabs type="segment" class="main-tabs" animated>
      <n-tab-pane name="components" tab="组件">
        <div class="scroll-content">
          <!-- 组件区域 -->
          <div class="panel-section">
            <div class="panel-title">基础组件</div>
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
          </div>

          <!-- Naive UI 组件区域 -->
          <div class="panel-section">
            <div class="panel-title">Naive UI 组件</div>
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
          </div>
        </div>
      </n-tab-pane>
      
      <n-tab-pane name="variables" tab="变量">
        <div class="variables-content">
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

    <!-- 页面管理区域 -->
    <div class="panel-section fixed-section">
      <PageManagerVertical />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  NTabs, NTabPane, NButton, NInput, NSelect, 
  NSpace, NTag, NPopconfirm, NIcon, NForm, NFormItem, NModal,
  NList, NListItem
} from 'naive-ui';
import { Add, Trash, Create, Save, Close, GitNetwork } from '@vicons/ionicons5';
import { CompType } from '../comps/base';
import PageManagerVertical from './PageManagerVertical.vue';
import { naiveComponentRegistry } from '../../config/naive-ui-registry';
import { usePageStore } from '../../stores/page';
import type { PageVariable, PageFlow } from '../../types/page';

const emit = defineEmits(['open-flow-editor']);

const pageStore = usePageStore();
const currentPage = computed(() => pageStore.currentPage);
const variables = computed(() => currentPage.value?.variables || []);
const flows = computed(() => currentPage.value?.flows || []);

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
  width: 240px;
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
  padding-bottom: 16px;
}

/* 自定义滚动条样式 */
.scroll-content::-webkit-scrollbar {
  width: 6px;
}

.scroll-content::-webkit-scrollbar-thumb {
  background-color: #e0e0e0;
  border-radius: 3px;
}

.scroll-content::-webkit-scrollbar-track {
  background-color: transparent;
}

.panel-section {
  flex-shrink: 0;
}

.fixed-section {
  border-top: 1px solid #f0f0f0;
  background: #fff;
  z-index: 10;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
}

.panel-section:not(:last-child) {
  /* border-bottom: 1px solid #f0f0f0; */
  /* margin-bottom: 16px; */
  /* padding-bottom: 16px; */
}

.panel-title {
  padding: 20px 16px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
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
  padding: 12px 4px;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease;
  background: white;
  border: 1px solid #e8e8e8;
  height: 30px;
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
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: inherit;
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
}

/* Variables Styles */
.variables-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
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
