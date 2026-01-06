# 渲染选项属性组件
<template>
  <PropertySection title="渲染配置">
    <template #content>
      <div class="dynamic-properties">
        <!-- 是否显示 -->
        <div class="property-row">
          <div class="prop-label">
            <span class="label-text">是否显示</span>
            <span v-if="props.renderVisibleBinding" class="bind-badge">
              {{ formatBindingDisplay(props.renderVisibleBinding) }}
            </span>
          </div>
          <div class="input-wrapper">
            <div v-if="props.renderVisibleBinding" class="bound-placeholder" />
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
                :type="props.renderVisibleBinding ? 'error' : 'default'"
                class="bind-btn"
                title="绑定变量"
              >
                <template #icon>
                  <n-icon><Link v-if="props.renderVisibleBinding" /><LinkOutline v-else /></n-icon>
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
            <span v-if="props.loopItemsBinding" class="bind-badge">
              {{ formatBindingDisplay(props.loopItemsBinding) }}
            </span>
          </div>
          <div class="input-wrapper">
            <div v-if="props.loopItemsBinding" class="bound-placeholder" />
            <n-select
              v-else
              size="small"
              placeholder="选择数组变量"
              :options="arrayVariableOptions"
              :value="props.loopItemsBinding"
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
                :type="props.loopItemsBinding ? 'error' : 'default'"
                class="bind-btn"
                title="绑定变量"
              >
                <template #icon>
                  <n-icon><Link v-if="props.loopItemsBinding" /><LinkOutline v-else /></n-icon>
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

        <div v-if="props.loopValidationMessage" class="loop-warning">
          {{ props.loopValidationMessage }}
        </div>
      </div>
    </template>
  </PropertySection>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NButton, NIcon, NPopover, NSelect } from 'naive-ui';
import { Link, LinkOutline } from '@vicons/ionicons5';
import PropertySection from './PropertySection.vue';
import VariablePanel from '../flow/VariablePanel.vue';
import { formatBindingRefDisplay } from '../../utils/bindingRef';
import type { PageVariable } from '../../types/page';
import type { VariableTreeNode } from '../flow/variableTree';

const props = withDefaults(
  defineProps<{
    renderVisible?: boolean | any;
    loopEnabled?: boolean | any;
    renderVisibleBinding?: string;
    loopItemsBinding?: string;
    loopValidationMessage?: string;
    pageVariableTree: VariableTreeNode[];
    arrayVariables?: PageVariable[];
  }>(),
  {
    renderVisible: true,
    loopEnabled: false,
    renderVisibleBinding: '',
    loopItemsBinding: '',
    loopValidationMessage: '',
    arrayVariables: () => []
  }
);

const emit = defineEmits<{
  (e: 'update', value: Record<string, any>): void;
  (e: 'updateBindings', key: string, value: string | null): void;
}>();

const renderBindingOpenKey = ref<string | null>(null);

// 响应式计算
const renderVisibleValue = computed({
  get: () => props.renderVisible !== false,
  set: (value: boolean) => updateProps({ renderVisible: value })
});

const loopEnabledValue = computed({
  get: () => props.loopEnabled === true,
  set: (value: boolean) => updateProps({ loopEnabled: value })
});

// 数组变量选项
const arrayVariableOptions = computed(() => {
  return props.arrayVariables
    .filter(v => v.type === 'array')
    .map(v => ({ label: v.name, value: `var:${v.name}` }))
});

// 更新方法
function updateProps(updates: Record<string, any>) {
  emit('update', updates);
}

function updateLoopItemsBinding(value: string | null) {
  emit('updateBindings', 'loopItems', value);
}

function handleRenderBindPick(key: string, value: string) {
  emit('updateBindings', key, value === '__unbind__' ? null : value);
  renderBindingOpenKey.value = null;
}

function formatBindingDisplay(binding: string): string {
  return formatBindingRefDisplay(binding);
}
</script>

<style scoped>
.dynamic-properties {
  border-top: none;
  padding: 0;
}

.property-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.property-row:last-child {
  margin-bottom: 0;
}

.prop-label {
  width: 80px;
  font-size: 11px;
  color: #666;
  font-weight: 500;
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
  font-size: 10px;
  color: #999;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.input-wrapper {
  flex: 1;
  display: flex;
  min-width: 0;
  gap: 4px;
}

.bound-placeholder {
  width: 100%;
  height: 24px;
  border: 1px dashed #e5e5e5;
  border-radius: 3px;
  padding: 0 8px;
  font-size: 11px;
  color: #999;
  display: flex;
  align-items: center;
  background: #fafafa;
}

.checkbox-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 14px;
  height: 14px;
  cursor: pointer;
}

.bind-btn {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.bind-btn:hover {
  border-color: #d9d9d9;
  background: #fafafa;
}

.loop-warning {
  margin-top: 8px;
  padding: 6px 8px;
  font-size: 10px;
  color: #ad4e00;
  background: #fff7e6;
  border: 1px solid #ffe7ba;
  border-radius: 3px;
  line-height: 1.4;
}
</style>
