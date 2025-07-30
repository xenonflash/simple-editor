<script setup lang="ts">
import { computed, onMounted } from 'vue'; // 移除 ref
import LeftPanel from '../components/layout/LeftPanel.vue';
import PropertiesPanel from '../components/layout/PropertiesPanel.vue';
import Board from '../components/layout/Board.vue';
import PageManager from '../components/layout/PageManager.vue';
import { usePageStore } from '../stores/page';
import type { Comp } from '../components/comps/base';

// 页面store
const pageStore = usePageStore();

// 计算属性 - 直接从 store 获取
const components = computed(() => pageStore.currentComponents);
const selectedComponent = computed(() => pageStore.primarySelectedComp); // 使用第一个选中的组件

// 移除 selectedId 相关代码

// 初始化
onMounted(() => {
  pageStore.initializeDefaultPage();
});

// 处理组件选中 - 简化
function handleSelect(id: string | null) {
  console.log('Selected component:', id);
  pageStore.selectComponent(id);
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
  pageStore.selectComponent(comp.id); // 选中新添加的组件
}

// 处理删除组件
function handleDeleteComponent(id: string) {
  console.log('Delete component:', id);
  pageStore.deleteComponentFromCurrentPage(id);
  // 删除逻辑已在 store 中处理选中状态
}
</script>

<template>
  <div class="editor-container">
    <PageManager />
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

<!-- 样式保持不变 -->
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
