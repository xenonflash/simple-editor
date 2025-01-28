<script setup lang="ts">
import { ref, computed } from 'vue';
import TopBar from './components/layout/TopBar.vue';
import LeftPanel from './components/layout/LeftPanel.vue';
import PropertiesPanel from './components/layout/PropertiesPanel.vue';
import Board from './components/layout/Board.vue';
import type { Comp } from './components/comps/base';

// 状态管理
const components = ref<Comp[]>([]);
const selectedId = ref<string | null>(null);
const boardRef = ref<InstanceType<typeof Board> | null>(null);

// 计算当前选中的组件
const selectedComponent = computed(() => {
  if (!selectedId.value) return null;
  return components.value.find(comp => comp.id === selectedId.value) || null;
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
    components.value = compOrComps;
  } else {
    // 更新单个组件
    const index = components.value.findIndex(c => c.id === compOrComps.id);
    if (index > -1) {
      components.value.splice(index, 1, {
        ...components.value[index],
        ...compOrComps,
        props: { ...components.value[index].props, ...compOrComps.props }
      });
    }
  }
}

// 处理添加组件
function handleAddComponent(comp: Comp) {
  console.log('Add component:', comp);
  components.value.push(comp);
  selectedId.value = comp.id;
}

// 处理删除组件
function handleDeleteComponent(id: string) {
  console.log('Delete component:', id);
  const index = components.value.findIndex(c => c.id === id);
  if (index > -1) {
    components.value.splice(index, 1);
    if (selectedId.value === id) {
      selectedId.value = null;
    }
  }
}
</script>

<template>
  <div class="app">
    <TopBar />
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

<style>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

.main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
}
</style>
