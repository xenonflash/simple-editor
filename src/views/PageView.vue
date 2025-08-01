<script setup lang="ts">
import { computed, onMounted } from 'vue';
import LeftPanel from '../components/layout/LeftPanel.vue';
import PropertiesPanel from '../components/layout/PropertiesPanel.vue';
import Board from '../components/layout/Board.vue';
import { usePageStore } from '../stores/page';
import type { Comp } from '../components/comps/base';

// 页面store
const pageStore = usePageStore();

// 计算属性 - 直接从 store 获取
const components = computed(() => pageStore.currentComponents);
const selectedComponent = computed(() => pageStore.primarySelectedComp);

// 初始化
onMounted(() => {
  pageStore.initializeDefaultPage();
});

// 处理组件选中
function handleSelect(id: string | null) {
  console.log('Selected component:', id);
  pageStore.selectComponent(id);
}

// 处理组件更新
function handleUpdate(compOrComps: Comp | Comp[]) {
  if (Array.isArray(compOrComps)) {
    pageStore.updateCurrentPageComponents(compOrComps);
  } else {
    pageStore.updateComponentInCurrentPage(compOrComps);
  }
}

// 处理添加组件
function handleAddComponent(comp: Comp) {
  console.log('Add component:', comp);
  pageStore.addComponentToCurrentPage(comp);
  pageStore.selectComponent(comp.id);
}

// 处理删除组件
function handleDeleteComponent(id: string) {
  console.log('Delete component:', id);
  pageStore.deleteComponentFromCurrentPage(id);
}
</script>

<template>
  <div class="editor-container">
    <div class="main">
      <LeftPanel />
      <Board 
             :components="components"
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
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 关键：防止整个容器滚动 */
}

.main {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0; /* 关键：允许flex子项收缩 */
}
</style>
