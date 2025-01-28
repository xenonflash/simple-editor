<script setup lang="ts">
import { ref } from 'vue';
import TopBar from './components/layout/TopBar.vue';
import LeftPanel from './components/layout/LeftPanel.vue';
import Board from './components/layout/Board.vue';
import RightPanel from './components/layout/RightPanel.vue';
import type { Comp } from './components/comps/base';

// 状态管理
const components = ref<Comp[]>([]);
const selectedId = ref<string | null>(null);
const boardRef = ref<InstanceType<typeof Board> | null>(null);

// 处理组件选中
function handleSelect(id: string | null) {
  console.log('Selected component:', id);
  selectedId.value = id;
}

// 处理组件更新
function handleUpdate(comp: Comp) {
  const index = components.value.findIndex(c => c.id === comp.id);
  if (index > -1) {
    components.value[index] = { ...comp };
  }
}

// 处理添加组件
function handleAddComponent(comp: Comp) {
  console.log('Add component:', comp);
  components.value.push(comp);
  selectedId.value = comp.id;
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
             @add="handleAddComponent" />
      <RightPanel :components="components"
                 :selected-id="selectedId"
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
