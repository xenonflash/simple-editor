<template>
  <n-dropdown 
    :options="dropdownOptions" 
    @select="handleSelect"
    trigger="hover"
    placement="bottom-end"
    :show-arrow="true"
  >
    <n-avatar 
      round 
      :size="32"
      :src="userStore.user?.avatar"
      :fallback-src="defaultAvatar"
      class="user-avatar"
    >
      {{ userStore.user?.nickname?.[0] || userStore.user?.username?.[0] || 'U' }}
    </n-avatar>
  </n-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { NAvatar, NDropdown, useMessage } from 'naive-ui'

const router = useRouter()
const userStore = useUserStore()
const message = useMessage()

const defaultAvatar = 'https://avatars.githubusercontent.com/u/1?v=4'

const dropdownOptions = computed(() => [
  {
    label: userStore.user?.nickname || userStore.user?.username || '用户',
    key: 'user-info',
    disabled: true,
    props: {
      style: {
        fontWeight: '500',
        color: '#333',
        fontSize: '14px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        padding: '8px 12px'
      }
    }
  },
  {
    type: 'divider',
    key: 'divider'
  },
  {
    label: '退出登录',
    key: 'logout',
    props: {
      style: {
        color: '#d03050',
        fontSize: '14px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        padding: '8px 12px'
      }
    }
  }
])

async function handleSelect(key: string) {
  if (key === 'logout') {
    try {
      await userStore.logout()
      message.success('已退出登录')
      router.push('/login')
    } catch (error) {
      console.error('退出登录失败:', error)
      message.error('退出登录失败')
    }
  }
}
</script>

<style scoped>
.user-avatar {
  cursor: pointer;
  transition: transform 0.2s ease;
  border: 1px solid transparent;
}

.user-avatar:hover {
  transform: scale(1.05);
  border-color: #e8e8e8;
}

/* 自定义下拉菜单样式 */
:deep(.n-dropdown-menu) {
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8e8e8;
  padding: 4px 0;
  min-width: 140px;
}

:deep(.n-dropdown-option) {
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  padding: 8px 12px;
  margin: 0 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

:deep(.n-dropdown-option:hover) {
  background-color: #f5f5f5;
}

:deep(.n-dropdown-option--disabled) {
  background-color: transparent !important;
  cursor: default;
}

:deep(.n-dropdown-divider) {
  margin: 4px 8px;
  background-color: #e8e8e8;
}
</style>