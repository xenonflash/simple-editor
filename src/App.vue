<script setup lang="ts">
import TopBar from './components/layout/TopBar.vue';
import { useUserStore } from './stores/user'
import { ref, onBeforeMount } from 'vue'

const userStore = useUserStore()
onBeforeMount(() => {
  userStore.initAuth()
})
const showTopbar = ref(!/\/login/.test(location.pathname))
</script>

<template>
  <div class="app">
    <TopBar v-if="showTopbar"/>
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
