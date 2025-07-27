<script setup lang="ts">
import TopBar from './components/layout/TopBar.vue';
</script>

<template>
  <div class="app">
    <TopBar />
    <router-view />
  </div>
</template>

<style>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
}
</style>
