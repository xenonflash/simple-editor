<!-- src/components/UserProfile.vue -->
<template>
  <div class="user-profile">
    <div class="user-avatar">
      <img v-if="userStore.user?.avatar" :src="userStore.user.avatar" :alt="userStore.user.nickname" />
      <div v-else class="avatar-placeholder">
        {{ userStore.user?.nickname?.[0] || userStore.user?.username?.[0] || 'U' }}
      </div>
    </div>
    
    <div class="user-info">
      <div class="user-name">{{ userStore.user?.nickname || userStore.user?.username }}</div>
      <div class="user-email">{{ userStore.user?.email || '未设置邮箱' }}</div>
    </div>
    
    <div class="user-actions">
      <button @click="handleLogout" class="logout-btn">
        退出登录
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 14px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.user-email {
  color: #666;
  font-size: 12px;
}

.logout-btn {
  padding: 4px 8px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.logout-btn:hover {
  background: #c0392b;
}
</style>