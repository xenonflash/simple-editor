<template>
  <div class="right-panel">
    <div class="panel-title">属性</div>
    <div v-if="selectedComponent" class="properties-form">
      <div class="form-item">
        <label>组件 ID</label>
        <div class="form-value">{{ selectedComponent.id }}</div>
      </div>
      <div class="form-item">
        <label>名称</label>
        <input type="text" 
               v-model="componentName"
               @input="handleNameChange" />
      </div>
      <div class="form-item">
        <label>宽度</label>
        <input type="number" 
               v-model.number="componentWidth"
               @input="handlePropsChange" />
      </div>
      <div class="form-item">
        <label>高度</label>
        <input type="number" 
               v-model.number="componentHeight"
               @input="handlePropsChange" />
      </div>
    </div>
    <div v-else class="no-selection">
      请选择一个组件
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Comp } from '../comps/base';

const props = defineProps<{
  components: Comp[];
  selectedId: string | null;
}>();

const emit = defineEmits<{
  (e: 'update', comp: Comp): void;
}>();

const selectedComponent = computed(() => 
  props.components.find(comp => comp.id === props.selectedId)
);

// 本地状态
const componentName = ref('');
const componentWidth = ref(200);
const componentHeight = ref(100);

// 监听选中组件变化
watch(selectedComponent, (comp) => {
  if (comp) {
    componentName.value = comp.name;
    componentWidth.value = comp.props.width || 200;
    componentHeight.value = comp.props.height || 100;
  }
}, { immediate: true });

function handleNameChange() {
  if (selectedComponent.value) {
    emit('update', {
      ...selectedComponent.value,
      name: componentName.value
    });
  }
}

function handlePropsChange() {
  if (selectedComponent.value) {
    emit('update', {
      ...selectedComponent.value,
      props: {
        ...selectedComponent.value.props,
        width: componentWidth.value,
        height: componentHeight.value
      }
    });
  }
}
</script>

<style scoped>
.right-panel {
  width: 280px;
  background: #fff;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.panel-title {
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
}

.properties-form {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 12px;
  color: #666;
}

.form-value {
  font-size: 14px;
  color: #333;
  padding: 4px 0;
}

.form-item input {
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-item input:hover {
  border-color: #40a9ff;
}

.form-item input:focus {
  border-color: #1890ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.no-selection {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>
