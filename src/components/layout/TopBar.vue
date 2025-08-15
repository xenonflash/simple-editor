<template>
  <div class="topbar">
    <div class="logo">K-CREATOR</div>
    <div class="right-section">
      <div class="actions">
        <router-link to="/" class="action-btn" :class="{ active: $route.path === '/' }">页面</router-link>
        <router-link to="/flow" class="action-btn" :class="{ active: $route.path === '/flow' }">行为</router-link>
        <router-link to="/data" class="action-btn" :class="{ active: $route.path === '/data' }">数据</router-link>
        <!-- <router-link to="/debug" class="action-btn" :class="{ active: $route.path === '/debug' }">debug</router-link> -->
      </div>
      <UserAvatar v-if="userStore.isLoggedIn" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import UserAvatar from './UserAvatar.vue'

const userStore = useUserStore()
</script>

<style scoped>
.topbar {
  height: 48px;
  background-color: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  padding: 0 16px;
  justify-content: space-between;
}

.logo {
  font-size: 16px;
  font-weight: bold;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  padding: 6px 16px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: 14px;
  border-radius: 4px;
  transition: background-color 0.2s;
  text-decoration: none;
  color: inherit;
  display: inline-block;
}

.action-btn:hover {
  background-color: #f5f5f5;
}

.action-btn.active {
  background-color: #000;
  color: white;
}
</style>
