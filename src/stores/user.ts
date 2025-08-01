// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi, type User, type LoginForm } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoading = ref(false)
  const isInitialized = ref(false) // 添加初始化状态标记

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  // 登录
  async function login(loginForm: LoginForm) {
    isLoading.value = true
    try {
      const result = await userApi.login(loginForm)
      
      token.value = result.data.token
      user.value = result.data.user
      localStorage.setItem('token', result.data.token)
      
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.message || '登录失败' }
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  async function logout() {
    try {
      await userApi.logout()
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
    if (!token.value) return { success: false, message: '无token' }
    
    try {
      const result = await userApi.getUserInfo()
      user.value = result.data
      return { success: true }
    } catch (error: any) {
      console.error('获取用户信息失败:', error)
      // 如果是认证错误，清除token
      if (error.response?.status === 401) {
        token.value = null
        user.value = null
        localStorage.removeItem('token')
      }
      return { success: false, message: error.message }
    }
  }

  // 更新用户信息
  async function updateUser(updateData: Partial<User>) {
    try {
      const result = await userApi.updateUser(updateData)
      user.value = result.data
      return { success: true }
    } catch (error: any) {
      return { success: false, message: error.message }
    }
  }

  // 修复：简化初始化逻辑，移除强制跳转
  async function initAuth() {
    if (token.value) {
      console.log('检测到token，尝试获取用户信息')
      await getUserInfo()
    }
    isInitialized.value = true // 标记初始化完成
    console.log('用户认证初始化完成，isLoggedIn:', isLoggedIn.value)
  }

  return {
    user,
    token,
    isLoading,
    isLoggedIn,
    isInitialized, // 导出初始化状态
    login,
    logout,
    getUserInfo,
    updateUser,
    initAuth
  }
})