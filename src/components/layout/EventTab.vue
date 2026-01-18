# 事件面板组件
<template>
  <div class="event-tab">
    <div class="event-list">
      <PropertySection
        v-for="eventDef in supportedEvents"
        :key="eventDef.name"
        :title="eventDef.label"
        :default-collapsed="true"
      >
        <template #head>
          <n-badge 
            :value="getEventBindCount(eventDef.name)" 
            type="info" 
            :show-zero="false"
          />
        </template>
        
        <template #content>
          <!-- 已绑定列表 -->
          <div v-if="getEventBindCount(eventDef.name) > 0" class="bound-list">
            <!-- Flow Item -->
            <div v-if="getFlowForEvent(eventDef.name)" class="bound-item flow-item">
              <div class="item-icon"><n-icon><GitNetworkOutline /></n-icon></div>
              <div class="item-content">
                <div class="item-title">{{ getFlowName(getFlowForEvent(eventDef.name)) }}</div>
              </div>
              <div class="item-actions">
                <n-button size="tiny" quaternary circle @click="openFlowEditor(getFlowForEvent(eventDef.name))">
                  <template #icon><n-icon><Create /></n-icon></template>
                </n-button>
                <n-popconfirm @positive-click="removeFlow(eventDef.name)">
                  <template #trigger>
                    <n-button size="tiny" quaternary circle type="error">
                      <template #icon><n-icon><Close /></n-icon></template>
                    </n-button>
                  </template>
                  确定移除绑定的逻辑流吗？
                </n-popconfirm>
              </div>
            </div>

            <!-- Action Items -->
            <div v-for="(action, index) in getActionsForEvent(eventDef.name)" :key="index" class="bound-item action-item">
              <div class="item-icon"><n-icon><FlashOutline /></n-icon></div>
              <div class="item-content">
                <div class="item-title">{{ getActionLabel(action.type) }}</div>
                <div class="item-desc">{{ getActionDesc(action) }}</div>
              </div>
              <div class="item-actions">
                <n-button size="tiny" quaternary circle @click="editAction(eventDef.name, index)">
                  <template #icon><n-icon><Create /></n-icon></template>
                </n-button>
                <n-popconfirm @positive-click="removeAction(eventDef.name, index)">
                  <template #trigger>
                    <n-button size="tiny" quaternary circle type="error">
                      <template #icon><n-icon><Close /></n-icon></template>
                    </n-button>
                  </template>
                  确定删除此动作吗？
                </n-popconfirm>
              </div>
            </div>
            
            <!-- 小添加按钮 (继续添加) -->
             <div class="add-more-wrapper">
               <n-button size="small" dashed block @click="addEventAction(eventDef.name)">
                 <template #icon><n-icon><Add /></n-icon></template>
                 添加动作
               </n-button>
             </div>
          </div>

          <!-- 空状态：添加按钮 -->
          <div v-else class="empty-add-wrapper">
             <n-button size="small" dashed block @click="addEventAction(eventDef.name)">
               <template #icon><n-icon><Add /></n-icon></template>
               添加动作
             </n-button>
          </div>
        </template>
      </PropertySection>
    </div>

    <!-- 动作配置弹窗 -->
    <n-modal v-model:show="showActionModal" preset="card" :title="editingActionIndex === -1 ? '添加动作' : '编辑动作'" style="width: 600px">
      <n-tabs type="segment" animated v-model:value="activeTab">
        <n-tab-pane name="action" tab="常用动作">
          <div class="action-type-grid" v-if="editingActionIndex === -1 && !currentAction.type">
             <div 
               v-for="actionReq in actionRegistry" 
               :key="actionReq.type" 
               class="action-card"
               @click="selectActionType(actionReq.type)"
             >
               <div class="action-card-title">{{ actionReq.label }}</div>
               <div class="action-card-desc">{{ actionReq.description }}</div>
             </div>
          </div>
          
          <n-form v-else size="small" label-placement="left" label-width="80">
            <div style="margin-bottom: 16px; font-weight: bold; color: #666; display: flex; align-items: center; gap: 8px;">
               <n-button text v-if="editingActionIndex === -1" @click="currentAction.type = ''">
                 <n-icon><ArrowBack /></n-icon> 返回
               </n-button>
               <span>配置 {{ getActionLabel(currentAction.type) }}</span>
            </div>
            <!-- 动态渲染参数表单 -->
            <template v-if="currentActionDef">
              <n-form-item v-for="(schema, key) in currentActionDef.paramsSchema" :key="key" :label="schema.label">
                <n-select v-if="key === 'variableName'"
                          v-model:value="currentAction.params[key]"
                          :options="variableOptions"
                          placeholder="选择变量" />

                <!-- Special handling for 'emitEvent' -->
                <n-select v-else-if="currentAction.type === 'emitEvent' && key === 'eventName' && customEventOptions.length > 0"
                          v-model:value="currentAction.params[key]"
                          :options="customEventOptions"
                          placeholder="选择自定义事件" />

                <n-input v-else-if="schema.type === 'text'" v-model:value="currentAction.params[key]" />
                <n-input-number v-else-if="schema.type === 'number'" v-model:value="currentAction.params[key]" />
                <n-switch v-else-if="schema.type === 'boolean'" v-model:value="currentAction.params[key]" />
                <n-select v-else-if="schema.type === 'select'" v-model:value="currentAction.params[key]" :options="schema.options" />
                <n-input v-else-if="schema.type === 'json'" type="textarea" v-model:value="currentAction.params[key]" placeholder="JSON/代码" />
              </n-form-item>
            </template>
            <div style="text-align: right; margin-top: 20px;">
              <n-button size="small" @click="showActionModal = false" style="margin-right: 8px">取消</n-button>
              <n-button size="small" type="primary" @click="saveAction">保存</n-button>
            </div>
          </n-form>
        </n-tab-pane>
        
        <n-tab-pane name="flow" tab="逻辑流 (Flow)">
          <n-list hoverable clickable>
             <n-list-item v-for="flow in flows" :key="flow.id" @click="selectFlow(flow.id)">
               <div style="display: flex; justify-content: space-between; align-items: center;">
                 <span>{{ flow.name }}</span>
                 <n-tag size="small" :type="currentFlowId === flow.id ? 'primary' : 'default'">
                    {{ currentFlowId === flow.id ? '已选择' : '选择' }}
                 </n-tag>
               </div>
             </n-list-item>
             <n-list-item v-if="flows.length === 0">
               <n-empty description="暂无逻辑流" />
             </n-list-item>
          </n-list>
        </n-tab-pane>
      </n-tabs>
    </n-modal>
  </div>
</template>


<script setup lang="ts">
import { computed, ref } from 'vue';
import { 
  NButton, NIcon, NModal, NForm, NFormItem, NSelect, NInput, NInputNumber, NSwitch, 
  NBadge, NTabs, NTabPane, NList, NListItem, NTag, NPopconfirm, NEmpty 
} from 'naive-ui';
import { Add, Trash, Create, GitNetworkOutline, FlashOutline, Close, ArrowBack } from '@vicons/ionicons5';
import PropertySection from '../properties/PropertySection.vue';
import { actionRegistry } from '../../config/actions';
import { getNaiveConfig } from '../../config/naive-ui-registry';
import { atomConfigs } from '../comps/atomConfig';
import { usePageStore } from '../../stores/page';
import { useCustomComponentsStore } from '../../stores/customComponents';
import type { Comp, CompEventAction, CompEvent } from '../comps/base';
import type { PageFlow } from '../../types/page';
import type { EventSpec } from '../../types/event';

const props = defineProps<{
  component: Comp;
  currentPage: any;
  editingCustomEventsSchema?: Record<string, EventSpec> | null;
}>();

const emit = defineEmits<{
  (e: 'update', data: any): void;
  (e: 'open-flow-editor', flowId?: string): void;
}>();

const pageStore = usePageStore();
const customComponentsStore = useCustomComponentsStore();

// Modal State
const showActionModal = ref(false);
const activeTab = ref('action');
const currentEventName = ref('');
const editingActionIndex = ref(-1);
const currentAction = ref<CompEventAction>({ id: '', type: '', params: {} });
const currentFlowId = ref<string>('');

// Flow 相关
const flows = computed(() => (props.currentPage?.flows as PageFlow[]) || []);

// 支持的事件
const supportedEvents = computed(() => {
  const list: any[] = [];

  // 1. 自定义组件实例：读取 eventsSchema
  if (props.component.custom?.defId) {
    const def = customComponentsStore.getById(props.component.custom.defId)
    // 如果存在 edit schema 且当前是在编辑对应组件（ID匹配），则使用 edit schema？
    // 这里简单起见，只要有 def 且有 eventsSchema 就展示
    if (def?.eventsSchema) {
      const customEvents = Object.entries(def.eventsSchema).map(([key, spec]) => ({
        name: key,
        label: spec.label || key
      }))
      list.push(...customEvents)
    }
  }

  const naiveConfig = getNaiveConfig(props.component.type);
  if (naiveConfig && naiveConfig.events) {
    list.push(...naiveConfig.events);
  } else {
    const atomConfig = atomConfigs[props.component.type];
    if (atomConfig && atomConfig.events) {
      list.push(...atomConfig.events);
    }
  }

  return list;
});

function getEventBindCount(eventName: string): number {
  if (!props.component || !props.component.events) return 0;
  const event = props.component.events[eventName];
  if (!event) return 0;
  
  // Find the specific handler logic
  const handler = Array.isArray(event) 
    ? event.find((e: CompEvent) => e.trigger === eventName)
    : undefined;
    
  if (!handler) return 0;
  
  let count = handler.actions ? handler.actions.length : 0;
  if (handler.flowId) count += 1;
  return count;
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

function getFlowName(flowId: string | undefined): string {
  if (!flowId) return '';
  const flow = flows.value.find(f => f.id === flowId);
  return flow ? flow.name : flowId;
}

// Actions Helpers
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

// Operations
function addEventAction(eventName: string) {
  currentEventName.value = eventName;
  editingActionIndex.value = -1;
  activeTab.value = 'action';
  // Check if there is already a flow bound, if so set as current
  currentFlowId.value = getFlowForEvent(eventName) || '';
  // Reset Action
  currentAction.value = { id: Date.now().toString(), type: '', params: {} };
  
  showActionModal.value = true;
}

function editAction(eventName: string, index: number) {
  currentEventName.value = eventName;
  editingActionIndex.value = index;
  activeTab.value = 'action';
  const actions = getActionsForEvent(eventName);
  if (actions[index]) {
    currentAction.value = JSON.parse(JSON.stringify(actions[index]));
  }
  showActionModal.value = true;
}

function openFlowEditor(flowId?: string) {
  emit('open-flow-editor', flowId);
}

// Modal Logic
const actionTypeOptions = actionRegistry.map(a => ({ label: a.label, value: a.type }));
const currentActionDef = computed(() => actionRegistry.find(a => a.type === currentAction.value.type));
const variableOptions = computed(() => {
  return (pageStore.currentPage?.variables || []).map(v => ({ label: v.name, value: v.name }));
});

const customEventOptions = computed(() => {
  if (!props.editingCustomEventsSchema) return []
  return Object.keys(props.editingCustomEventsSchema).map(k => ({
    label: props.editingCustomEventsSchema![k].label || k,
    value: k
  }))
})

function selectActionType(type: string) {
  currentAction.value.type = type;
  // Initialize params
  const def = actionRegistry.find(a => a.type === type);
  const newParams: Record<string, any> = {};
  if (def) {
    Object.keys(def.paramsSchema).forEach(key => {
       // defaults could be set here
       if (key === 'valueType') newParams[key] = 'string'; 
    });
  }
  currentAction.value.params = newParams;
}

function selectFlow(flowId: string) {
  updateEventFlow(currentEventName.value, flowId);
  showActionModal.value = false;
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

function saveAction() {
  if (activeTab.value === 'flow') {
    // Should be handled by selectFlow, but if user clicks save manually while on flow tab?
    // Maybe hide save button on flow tab? Or make selectFlow just select, and Save commits it.
    // For now, flow tab selects immediately. The Save button is inside Action tab form only (according to my template logic: "Save" is inside `n-tab-pane name="action"`).
    // Wait, in my template above, I put the save buttons inside the form which is inside tab-pane action.
    // But `n-modal` has a default `action` slot too if using `preset="dialog"`. 
    // I switched to `preset="card"` and custom content, so I control buttons.
    // In my template, the buttons are inside the Action form. Correct.
  }
  
  if (!props.component || !currentAction.value.type) return;

  const eventName = currentEventName.value;
  const newEvents = { ...(props.component.events || {}) };

  if (!newEvents[eventName]) {
    newEvents[eventName] = [{ trigger: eventName, actions: [] }];
  }

  let handler = newEvents[eventName].find((e: CompEvent) => e.trigger === eventName);
  if (!handler) {
    handler = { trigger: eventName, actions: [] };
    newEvents[eventName].push(handler);
  }
  // ensure handler is found
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

function removeFlow(eventName: string) {
   updateEventFlow(eventName, null);
}

</script>

<style scoped>
.event-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bound-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bound-item {
  display: flex;
  align-items: flex-start;
  padding: 10px;
  background: #fdfdfd;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  gap: 8px;
}

.flow-item {
  background: #e6f7ff;
  border-color: #91d5ff;
}

.item-icon {
  color: #666;
  font-size: 16px;
  margin-top: 2px;
}
.flow-item .item-icon {
  color: #1890ff;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.item-desc {
  font-size: 12px;
  color: #999;
}

.item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.bound-item:hover .item-actions {
  opacity: 1;
}

.add-more-wrapper {
  margin-top: 4px;
}

.empty-add-wrapper {
  padding: 12px;
}

.action-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 8px 0;
}
.action-card {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}
.action-card:hover {
  border-color: #1890ff;
  background: #f0f5ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.action-card-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: #333;
}
.action-card-desc {
  font-size: 12px;
  color: #888;
}
</style>
