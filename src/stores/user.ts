// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: string
  username: string
  nickname?: string
  email?: string
  avatar?: string
  createdAt: string
}

interface LoginForm {
  username: string
  password: string
}

const API_BASE = 'http://localhost:7001/api'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  // 登录
  async function login(loginForm: LoginForm) {
    isLoading.value = true
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginForm)
      })
      
      const result = await response.json()
      
      if (result.code === 200) {
        token.value = result.data.token
        user.value = result.data.user
        localStorage.setItem('token', result.data.token)
        return { success: true }
      } else {
        return { success: false, message: result.message }
      }
    } catch (error) {
      return { success: false, message: '网络错误' }
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  async function logout() {
    try {
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })
    } catch (error) {
      console.error('登出请求失败:', error)
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
    }
  }

  // 获取用户信息
  async function getUserInfo() {
    if (!token.value) return
    
    try {
      const response = await fetch(`${API_BASE}/userInfo`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      })
      
      const result = await response.json()
      
      if (result.code === 200) {
        user.value = result.data
      } else {
        // token可能已过期，清除本地存储
        await logout()
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  // 更新用户信息
  async function updateUser(updateData: Partial<User>) {
    try {
      const response = await fetch(`${API_BASE}/updateUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token.value}`
        },
        body: JSON.stringify(updateData)
      })
      
      const result = await response.json()
      
      if (result.code === 200) {
        user.value = result.data
        return { success: true }
      } else {
        return { success: false, message: result.message }
      }
    } catch (error) {
      return { success: false, message: '网络错误' }
    }
  }

  // 初始化时检查登录状态
  function initAuth() {
    if (token.value) {
      getUserInfo()
    }
  }

  return {
    user,
    token,
    isLoading,
    isLoggedIn,
    login,
    logout,
    getUserInfo,
    updateUser,
    initAuth
  }
})