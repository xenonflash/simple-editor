<template>
  <div class="dynamic-properties">
    <div v-for="(schema, key) in propsSchema" :key="key" class="property-row">
      <label :title="key">{{ schema.label }}</label>
      
      <div class="input-wrapper">
        <!-- 绑定模式 -->
        <template v-if="bindings && typeof bindings[key] === 'string'">
          <n-select size="small"
                    :value="bindings[key]"
                    :options="variableOptions"
                    placeholder="选择变量"
                    @update:value="(val) => updateBindingValue(key, val)" 
                    class="bind-select"/>
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
      <n-button size="tiny" quaternary circle 
                :type="bindings && typeof bindings[key] === 'string' ? 'error' : 'default'"
                @click="toggleBinding(key)"
                class="bind-btn"
                title="绑定变量">
        <template #icon>
          <n-icon><Link v-if="bindings && typeof bindings[key] === 'string'" /><LinkOutline v-else /></n-icon>
        </template>
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NSelect, NButton, NIcon } from 'naive-ui';
import { Link, LinkOutline } from '@vicons/ionicons5';
import type { PropSchema } from '../../config/naive-ui-registry';
import { usePageStore } from '../../stores/page';

const props = defineProps<{
  modelValue: Record<string, any>;
  bindings: Record<string, string>;
  propsSchema: Record<string, PropSchema>;
}>();

const emit = defineEmits(['update:modelValue', 'change', 'update:bindings']);
const pageStore = usePageStore();

// 获取当前页面的变量列表
const variableOptions = computed(() => {
  const vars = pageStore.currentPage?.variables || [];
  return vars.map(v => ({
    label: `${v.name}`,
    value: v.name
  }));
});

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

function toggleBinding(key: string) {
  if (props.bindings && typeof props.bindings[key] === 'string') {
    // 取消绑定
    emit('update:bindings', { [key]: null });
  } else {
    // 开始绑定
    const firstVar = variableOptions.value[0]?.value;
    emit('update:bindings', { [key]: firstVar || '' });
  }
}

function updateBindingValue(key: string, value: string) {
  emit('update:bindings', { [key]: value });
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

.property-row label {
  width: 70px;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.input-wrapper {
  flex: 1;
  display: flex;
  min-width: 0; /* 防止flex子项溢出 */
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

.bind-select {
  width: 100%;
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
