<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import LeftPanel from '../components/layout/LeftPanel.vue';
import PropertiesPanel from '../components/layout/PropertiesPanel.vue';
import Board from '../components/layout/Board.vue';
import PageManager from '../components/layout/PageManager.vue';
import { usePageStore } from '../stores/page';
import type { Comp } from '../components/comps/base';

// 页面store
const pageStore = usePageStore();

// 状态管理
const selectedId = ref<string | null>(null);
const boardRef = ref<InstanceType<typeof Board> | null>(null);

// 计算属性
const components = computed(() => pageStore.currentComponents);
const selectedComponent = computed(() => {
  if (!selectedId.value) return null;
  return components.value.find(comp => comp.id === selectedId.value) || null;
});

// 初始化
onMounted(() => {
  pageStore.initializeDefaultPage();
});

// 处理组件选中
function handleSelect(id: string | null) {
  console.log('Selected component:', id);
  selectedId.value = id;
}

// 处理组件更新
function handleUpdate(compOrComps: Comp | Comp[]) {
  if (Array.isArray(compOrComps)) {
    // 更新整个组件列表
    pageStore.updateCurrentPageComponents(compOrComps);
  } else {
    // 更新单个组件
    pageStore.updateComponentInCurrentPage(compOrComps);
  }
}

// 处理添加组件
function handleAddComponent(comp: Comp) {
  console.log('Add component:', comp);
  pageStore.addComponentToCurrentPage(comp);
  selectedId.value = comp.id;
}

// 处理删除组件
function handleDeleteComponent(id: string) {
  console.log('Delete component:', id);
  pageStore.deleteComponentFromCurrentPage(id);
  if (selectedId.value === id) {
    selectedId.value = null;
  }
}
</script>

<template>
  <div class="editor-container">
    <PageManager />
    <div class="main">
      <LeftPanel />
      <Board ref="boardRef" 
             :components="components"
             :selected-id="selectedId"
             @select="handleSelect"
             @update="handleUpdate"
             @add="handleAddComponent"
             @delete="handleDeleteComponent" />
      <PropertiesPanel :component="selectedComponent"
                      @update="handleUpdate" />
    </div>
  </div>
</template>

<style scoped>
.editor-container {
  height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>
