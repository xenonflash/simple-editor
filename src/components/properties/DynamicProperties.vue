<template>
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
          @select="(p) => p.value && handleBindPick(String(key), p.value)"
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
import type { PropSchema } from '../../config/naive-ui-registry';
import { usePageStore } from '../../stores/page';
import VariablePanel from '../flow/VariablePanel.vue'
import { buildPageVariableTree } from '../flow/variableTree'

const props = defineProps<{
  modelValue: Record<string, any>;
  bindings: Record<string, string>;
  propsSchema: Record<string, PropSchema>;
}>();

const emit = defineEmits(['update:modelValue', 'change', 'update:bindings']);
const pageStore = usePageStore();

const openKey = ref<string | null>(null)

const pageVariableTree = computed(() => buildPageVariableTree(pageStore))

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

function handleBindPick(key: string, value: string) {
  if (value === '__unbind__') {
    emit('update:bindings', { [key]: null })
  } else {
    emit('update:bindings', { [key]: value })
  }
  openKey.value = null
}

function formatBindingDisplay(binding: string): string {
  if (!binding) return ''
  if (binding.startsWith('var:')) return binding.slice('var:'.length)
  if (binding.startsWith('comp:')) {
    const rest = binding.slice('comp:'.length)
    const parts = rest.split(':')
    const componentId = parts[0]
    const propName = parts.slice(1).join(':')
    const comp = pageStore.currentPage?.components?.find(c => c.id === componentId)
    const compLabel = comp?.name || componentId
    return `${compLabel}.${propName}`
  }
  // 兼容旧数据：直接存变量名
  return binding
}
</script>

<style scoped>
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
  min-width: 0; /* 防止flex子项溢出 */
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

.property-row input[type="text"],
.property-row input[type="number"],
.property-row select {
  width: 100%;
  height: 28px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 0 8px;
  font-size: 12px;
  outline: none;
}

.property-row input[type="text"]:focus,
.property-row input[type="number"]:focus,
.property-row select:focus {
  border-color: #1890ff;
}

.checkbox-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
}

.bind-btn {
  flex-shrink: 0;
}

.json-textarea {
  width: 100%;
  height: 80px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  padding: 4px;
  font-size: 12px;
  font-family: monospace;
  resize: vertical;
  outline: none;
}

.json-textarea:focus {
  border-color: #1890ff;
}
</style>
