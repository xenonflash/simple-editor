<template>
  <!-- 如果有 title，使用 PropertySection 包裹 -->
  <PropertySection v-if="title" :title="title">
    <template #content>
      <div class="dynamic-properties">
        <div v-for="(schema, key) in propsSchema" :key="key" class="property-row">
          <div class="prop-label" :title="key">
            <span class="label-text">{{ schema.label }}</span>
            <span v-if="bindings && typeof bindings[key] === 'string'" class="bind-badge">
              {{ formatBindingDisplay(String(bindings[key])) }}
            </span>
          </div>

          <div class="input-wrapper">
            <!-- 绑定模式 -->
            <template v-if="bindings && typeof bindings[key] === 'string'">
              <div class="bound-placeholder" />
            </template>

            <!-- 普通模式 -->
            <template v-else>
              <input v-if="schema.type === 'text'"
                     type="text"
                     :value="modelValue[key]"
                     @input="updateValue(key, ($event.target as HTMLInputElement).value)" />

              <input v-else-if="schema.type === 'number'"
                     type="number"
                     :value="modelValue[key]"
                     @input="updateValue(key, Number(($event.target as HTMLInputElement).value))" />

              <select v-else-if="schema.type === 'select'"
                       :value="modelValue[key]"
                       @change="updateValue(key, ($event.target as HTMLSelectElement).value)">
                <option v-for="opt in schema.options" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>

              <div v-else-if="schema.type === 'boolean'" class="checkbox-wrapper">
                <input type="checkbox"
                       :checked="modelValue[key]"
                       @change="updateValue(key, ($event.target as HTMLInputElement).checked)" />
              </div>

              <div v-else-if="schema.type === 'color'" class="color-wrapper">
                 <input type="color"
                       :value="modelValue[key]"
                       @input="updateValue(key, ($event.target as HTMLInputElement).value)" />
              </div>

              <textarea v-else-if="schema.type === 'json'"
                        class="json-textarea"
                        :value="JSON.stringify(modelValue[key], null, 2)"
                        @change="updateJsonValue(key, ($event.target as HTMLTextAreaElement).value)"
                        placeholder="请输入JSON数据"></textarea>
            </template>
          </div>

          <!-- 绑定按钮 -->
          <n-popover
            trigger="click"
            placement="left"
            :show-arrow="false"
            style="width: 420px"
            :show="openKey === String(key)"
            @update:show="(v) => (openKey = v ? String(key) : null)"
          >
            <template #trigger>
              <n-button
                size="tiny"
                quaternary
                circle
                :type="bindings && typeof bindings[key] === 'string' ? 'error' : 'default'"
                class="bind-btn"
                title="绑定变量"
              >
                <template #icon>
                  <n-icon><Link v-if="bindings && typeof bindings[key] === 'string'" /><LinkOutline v-else /></n-icon>
                </template>
              </n-button>
            </template>
            <VariablePanel
              :data="pageVariableTree"
              tip="点击变量直接绑定"
              select-mode="value"
              confirmable
              :allow-create="isCustomEditMode"
              :allow-two-way="isCustomEditMode"
              @select="(p) => p.value && handleBindPick(String(key), p.value, p.twoWay)"
              @create-prop="handleCreateProp"
              @cancel="openKey = null"
            />
          </n-popover>
        </div>
      </div>
    </template>
  </PropertySection>

  <!-- 如果没有 title，直接渲染内容（用于自定义组件内部）-->
  <div v-else class="dynamic-properties">
    <div v-for="(schema, key) in propsSchema" :key="key" class="property-row">
      <div class="prop-label" :title="key">
        <span class="label-text">{{ schema.label }}</span>
        <span v-if="bindings && typeof bindings[key] === 'string'" class="bind-badge">
          {{ formatBindingDisplay(String(bindings[key])) }}
        </span>
      </div>

      <div class="input-wrapper">
        <!-- 绑定模式 -->
        <template v-if="bindings && typeof bindings[key] === 'string'">
          <div class="bound-placeholder" />
        </template>

        <!-- 普通模式 -->
        <template v-else>
          <input v-if="schema.type === 'text'"
                 type="text"
                 :value="modelValue[key]"
                 @input="updateValue(key, ($event.target as HTMLInputElement).value)" />

          <input v-else-if="schema.type === 'number'"
                 type="number"
                 :value="modelValue[key]"
                 @input="updateValue(key, Number(($event.target as HTMLInputElement).value))" />

          <select v-else-if="schema.type === 'select'"
                   :value="modelValue[key]"
                   @change="updateValue(key, ($event.target as HTMLSelectElement).value)">
            <option v-for="opt in schema.options" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>

          <div v-else-if="schema.type === 'boolean'" class="checkbox-wrapper">
            <input type="checkbox"
                   :checked="modelValue[key]"
                   @change="updateValue(key, ($event.target as HTMLInputElement).checked)" />
          </div>

          <div v-else-if="schema.type === 'color'" class="color-wrapper">
             <input type="color"
                   :value="modelValue[key]"
                   @input="updateValue(key, ($event.target as HTMLInputElement).value)" />
          </div>

          <textarea v-else-if="schema.type === 'json'"
                    class="json-textarea"
                    :value="JSON.stringify(modelValue[key], null, 2)"
                    @change="updateJsonValue(key, ($event.target as HTMLTextAreaElement).value)"
                    placeholder="请输入JSON数据"></textarea>
        </template>
      </div>

      <!-- 绑定按钮 -->
      <n-popover
        trigger="click"
        placement="left"
        :show-arrow="false"
        style="width: 420px"
        :show="openKey === String(key)"
        @update:show="(v) => (openKey = v ? String(key) : null)"
      >
        <template #trigger>
          <n-button
            size="tiny"
            quaternary
            circle
            :type="bindings && typeof bindings[key] === 'string' ? 'error' : 'default'"
            class="bind-btn"
            title="绑定变量"
          >
            <template #icon>
              <n-icon><Link v-if="bindings && typeof bindings[key] === 'string'" /><LinkOutline v-else /></n-icon>
            </template>
          </n-button>
        </template>
        <VariablePanel
          :data="pageVariableTree"
          tip="点击变量直接绑定"
          select-mode="value"
          confirmable
          :allow-create="isCustomEditMode"
          :allow-two-way="isCustomEditMode"
          @select="(p) => p.value && handleBindPick(String(key), p.value, p.twoWay)"
          @create-prop="handleCreateProp"
          @cancel="openKey = null"
        />
      </n-popover>
    </div>
   </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { NButton, NIcon, NPopover } from 'naive-ui';
import { Link, LinkOutline } from '@vicons/ionicons5';
import PropertySection from './PropertySection.vue';
import type { PropSchema } from '../../config/naive-ui-registry';
import { usePageStore } from '../../stores/page';
import VariablePanel from '../flow/VariablePanel.vue'
import { buildPageVariableTree } from '../flow/variableTree'
import { formatBindingRefDisplay } from '../../utils/bindingRef'

const props = withDefaults(
  defineProps<{
    modelValue: Record<string, any>;
    bindings?: Record<string, string>;
    propsSchema: Record<string, PropSchema>;
    customProps?: Record<string, any> | null;
    customPropsCtxPath?: string;
    customPropsLabel?: string;
    loopAvailable?: boolean;
    loopItemSample?: any;
    title?: string;
    isCustomEditMode?: boolean;
  }>(),
  {
    bindings: () => ({}),
    customProps: null,
    customPropsCtxPath: undefined,
    customPropsLabel: undefined,
    loopAvailable: false,
    loopItemSample: undefined,
    title: undefined,
    isCustomEditMode: false
  }
);

const emit = defineEmits(['update:modelValue', 'change', 'update:bindings', 'create-prop']);
const pageStore = usePageStore();

const openKey = ref<string | null>(null)

const pageVariableTree = computed(() => buildPageVariableTree(pageStore, {
  customProps: props.customProps || undefined,
  customPropsCtxPath: props.customPropsCtxPath,
  customPropsLabel: props.customPropsLabel,
  loopAvailable: props.loopAvailable,
  loopItemSample: props.loopItemSample
}))

function updateValue(key: string, value: any) {
  emit('change', { [key]: value });
}

function updateJsonValue(key: string, value: string) {
  try {
    const parsed = JSON.parse(value);
    emit('change', { [key]: parsed });
  } catch (e) {
    console.error('Invalid JSON:', e);
    // 可以添加一个提示，或者不更新
  }
}

function handleBindPick(key: string, value: string, twoWay?: boolean) {
  if (value === '__unbind__') {
    emit('update:bindings', { [key]: null })
  } else {
    // Check if user requested two-way binding
    // Usually only applicable if binding to a custom prop ('props.xxx')
    let finalValue = value
    if (twoWay) {
        // Use prefix convention
        finalValue = `v-model:${value.replace(/^ctx:/, '')}`
    }
    emit('update:bindings', { [key]: finalValue })
  }
  openKey.value = null
}

function handleCreateProp(payload: any) {
    emit('create-prop', payload)
}

function formatBindingDisplay(binding: string): string {
  if (binding.startsWith('v-model:')) {
    return '🔄 ' + binding.replace('v-model:', '')
  }
  return formatBindingRefDisplay(binding, {
    getComponentLabel: (componentId) => {
      const comp = pageStore.currentPage?.components?.find(c => c.id === componentId)
      return comp?.name || componentId
    }
  })
}
</script>

<style scoped>
.dynamic-properties {
  padding: 0;
  border-top: none;
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
  min-width: 0; /* 防止flex子项溢出 */
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

.property-row input[type="text"],
.property-row input[type="number"],
.property-row select {
  width: 100%;
  height: 24px;
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  padding: 0 8px;
  font-size: 11px;
  outline: none;
  background: white;
  transition: all 0.2s;
}

.property-row input[type="text"]:focus,
.property-row input[type="number"]:focus,
.property-row select:focus {
  border-color: #000;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.property-row input[type="text"]:disabled,
.property-row input[type="number"]:disabled,
.property-row select:disabled {
  background: #fafafa;
  color: #999;
  cursor: not-allowed;
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

.json-textarea {
  width: 100%;
  height: 80px;
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  padding: 4px;
  font-size: 11px;
  font-family: monospace;
  resize: vertical;
  outline: none;
  transition: all 0.2s;
}

.json-textarea:focus {
  border-color: #000;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}
</style>
