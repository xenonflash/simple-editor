# 事件面板组件
<template>
  <PropertySection title="事件列表" :default-collapsed="false">
    <template #content>
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
    </template>
  </PropertySection>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NIcon, NModal, NForm, NFormItem, NSelect, NInput, NInputNumber, NSwitch } from 'naive-ui';
import { Add, Trash, Create } from '@vicons/ionicons5';
import PropertySection from '../properties/PropertySection.vue';
import { actionRegistry } from '../../config/actions';
import { getNaiveConfig } from '../../config/naive-ui-registry';
import { usePageStore } from '../../stores/page';
import type { Comp, CompEventAction, CompEvent } from '../comps/base';
import type { PageFlow } from '../../types/page';

const props = defineProps<{
  component: Comp;
  currentPage: any;
}>();

const emit = defineEmits<{
  (e: 'update', data: any): void;
  (e: 'open-flow-editor', flowId?: string): void;
}>();

const pageStore = usePageStore();

// Flow 相关
const flows = computed(() => (props.currentPage?.flows as PageFlow[]) || []);
const flowOptions = computed(() => [
  { label: '不绑定', value: '' },
  ...flows.value.map((f: PageFlow) => ({ label: f.name, value: f.id }))
]);

// 支持的事件
const supportedEvents = computed(() => {
  const config = getNaiveConfig(props.component.type);
  return config?.events || [];
});

// 事件相关方法
function openFlowEditor(flowId?: string) {
  emit('open-flow-editor', flowId);
}

function getFlowForEvent(eventName: string): string | undefined {
  if (!props.component || !props.component.events) return undefined;
  const event = props.component.events[eventName];
  if (Array.isArray(event)) {
    const handler = event.find((e: CompEvent) => e.trigger === eventName);
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

  const handler = newEvents[eventName].find((e: CompEvent) => e.trigger === eventName);
  if (!handler) {
    newEvents[eventName].push({ trigger: eventName, actions: [] });
  }

  const targetHandler = newEvents[eventName].find((e: CompEvent) => e.trigger === eventName)!;
  const normalized = flowId === null || flowId === '' ? undefined : flowId;
  targetHandler.flowId = normalized;

  emit('update', {
    id: props.component.id,
    type: props.component.type,
    events: newEvents
  });
}

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
    const handler = event.find((e: CompEvent) => e.trigger === eventName);
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

  const handler = newEvents[eventName].find((e: CompEvent) => e.trigger === eventName);
  if (!handler) {
    newEvents[eventName].push({ trigger: eventName, actions: [] });
  }

  const targetHandler = newEvents[eventName].find((e: CompEvent) => e.trigger === eventName)!;

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
  const handler = newEvents[eventName]?.find((e: CompEvent) => e.trigger === eventName);

  if (handler) {
    handler.actions.splice(index, 1);
    emit('update', {
      id: props.component.id,
      type: props.component.type,
      events: newEvents
    });
  }
}
</script>

<style scoped>
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

.flow-binding {
  padding: 8px;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 4px;
}

.action-list-header {
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flow-active-tip {
  padding: 8px;
  font-size: 11px;
  color: #1890ff;
  background: #e6f7ff;
}
</style>
