<template>
  <div class="layout">
    <TopBar />
    <div class="main-content">
      <LeftPanel />
      <Board />
      <RightPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import TopBar from './TopBar.vue'
import LeftPanel from './LeftPanel.vue'
import RightPanel from './RightPanel.vue'
import Board from './Board.vue'
</script>

<style scoped>
.layout {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}
</style>
