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
                         @update="updateProps" />

          <BorderProperties v-bind="props.component.props"
                          @update="updateProps" />

          <BorderRadiusProperties v-bind="props.component.props"
                               @update="updateProps" />

          <ShadowProperties v-bind="props.component.props"
                          @update="updateProps" />

          <BackgroundProperties v-bind="props.component.props"
                          @update="updateProps" />
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
  NButton, NIcon, NModal, NForm, NFormItem, NSelect, NInput, NInputNumber, NSwitch 
} from 'naive-ui';
import { Add, Trash, Create, GitNetwork } from '@vicons/ionicons5';
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
import { getNaiveConfig } from '../../config/naive-ui-registry';
import { usePageStore } from '../../stores/page';
import type { Comp } from '../comps/base';
import type { CompEventAction } from '../comps/base';
import { actionRegistry } from '../../config/actions';

const props = defineProps<{
  component: Comp | null;
}>();

const emit = defineEmits(['update', 'open-flow-editor']);
const pageStore = usePageStore();
const currentPage = computed(() => pageStore.currentPage);

const activeTab = ref('properties');
const naiveConfig = computed(() => props.component ? getNaiveConfig(props.component.type) : undefined);

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
  height: calc(100% - 36px); /* 关键：减去标签页高度 */
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
</style>
