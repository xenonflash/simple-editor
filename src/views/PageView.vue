<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import LeftPanel from '../components/layout/LeftPanel.vue';
import PropertiesPanel from '../components/layout/PropertiesPanel.vue';
import Board from '../components/layout/Board.vue';
import FlowEditorModal from '../components/flow/FlowEditorModal.vue';
import { usePageStore } from '../stores/page';
import type { Comp } from '../components/comps/base';

// 页面store
const pageStore = usePageStore();

// Flow 编辑器状态
const showFlowEditor = ref(false);
const currentFlowId = ref<string | null>(null);

function handleOpenFlowEditor(flowId?: string) {
  currentFlowId.value = flowId || null;
  showFlowEditor.value = true;
}

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

function handleAddComponentToContainer(payload: { containerId: string; comp: Comp }) {
  const ok = pageStore.addComponentToContainer(payload.containerId, payload.comp);
  if (ok) {
    pageStore.selectComponent(payload.comp.id);
  } else {
    // fallback: 如果容器不存在，退化为添加到顶层
    pageStore.addComponentToCurrentPage(payload.comp);
    pageStore.selectComponent(payload.comp.id);
  }
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
      <LeftPanel @open-flow-editor="handleOpenFlowEditor" />
      <Board 
             :components="components"
             @select="handleSelect"
             @update="handleUpdate"
             @add="handleAddComponent"
              @addToContainer="handleAddComponentToContainer"
             @delete="handleDeleteComponent" />
      <PropertiesPanel :component="selectedComponent"
                      @update="handleUpdate"
                      @open-flow-editor="handleOpenFlowEditor" />
    </div>
    
    <FlowEditorModal 
      v-model:show="showFlowEditor" 
      :flowId="currentFlowId" 
    />
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
