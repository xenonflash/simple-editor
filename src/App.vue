<script setup lang="ts">
import TopBar from './components/layout/TopBar.vue';
import MockIndicator from '@/components/MockIndicator.vue'
import { useUserStore } from './stores/user'
import { ref, onBeforeMount } from 'vue'
import { NConfigProvider, type GlobalThemeOverrides, NThemeEditor } from 'naive-ui'

const userStore = useUserStore()
onBeforeMount(() => {
  userStore.initAuth()
})

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#000',
    primaryColorHover: '#666',
  },
  Input: {
    textColor: '#333',
    focusColor: '#000',
    boxShadowFocus: '0 0 0 3px #ddd',
    borderColor: '#000',
    hoverBorderColor: '#000',
    activeBorderColor: '#000',
    borderHoverColor: '#000',
  },
}

const showTopbar = ref(!/\/login/.test(location.pathname))
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-theme-editor>
        <div class="app">
          <TopBar v-if="showTopbar" />
          <router-view />
          <!-- Mock 状态指示器 -->
          <MockIndicator />
        </div>
      </n-theme-editor>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
}
</style>
