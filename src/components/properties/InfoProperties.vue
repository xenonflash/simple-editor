# 组件信息属性组件
<template>
  <PropertySection title="组件信息">
    <template #content>
      <div class="info-row">
        <label class="info-label">组件名称</label>
        <input
          type="text"
          :value="props.name"
          @input="updateName"
          class="name-input"
          placeholder="请输入组件名称"
        />
      </div>
      <div class="info-row">
        <label class="info-label">组件ID</label>
        <div class="id-display">{{ props.id }}</div>
      </div>
      <div class="info-row">
        <label class="info-label">组件类型</label>
        <div class="type-display">{{ componentTypeLabel }}</div>
      </div>
    </template>
  </PropertySection>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PropertySection from './PropertySection.vue';
import { CompType } from '../comps/base';

const props = defineProps<{
  id: string;
  name: string;
  type: CompType | string;
}>();

const emit = defineEmits<{
  (e: 'update', value: { name?: string }): void;
}>();

// 组件类型标签
const componentTypeLabel = computed(() => {
  const t = props.type;
  if (t === CompType.CONTAINER) return '容器';
  if (t === CompType.TEXT) return '文字';
  if (t === CompType.BUTTON) return '按钮';
  if (typeof t === 'string' && t.startsWith('n-')) {
    // Naive UI 组件，提取名称部分（如 n-button -> Button）
    return t.replace('n-', '').split('-').map(s =>
      s.charAt(0).toUpperCase() + s.slice(1)
    ).join(' ');
  }
  return String(t);
});

function updateName(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update', { name: target.value });
}
</script>

<style scoped>
.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 80px;
  font-size: 11px;
  color: #666;
  font-weight: 500;
  flex-shrink: 0;
}

.name-input {
  flex: 1;
  height: 24px;
  padding: 0 8px;
  border: 1px solid #e5e5e5;
  border-radius: 3px;
  font-size: 11px;
  outline: none;
  background: white;
  transition: all 0.2s;
}

.name-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.name-input::placeholder {
  color: #ccc;
}

.id-display,
.type-display {
  flex: 1;
  height: 24px;
  padding: 0 8px;
  border: 1px solid #f5f5f5;
  border-radius: 3px;
  font-size: 11px;
  color: #999;
  background: #fafafa;
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-display {
  color: #666;
}
</style>
