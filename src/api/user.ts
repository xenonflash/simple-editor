// src/api/user.ts
import http from '@/utils/http'
import { mockService, isMockEnabled } from '@/mock'

export interface LoginForm {
  username: string
  password: string
}

export interface User {
  id: string
  username: string
  nickname?: string
  email?: string
  avatar?: string
  createdAt: string
}

// 用户相关 API
export const userApi = {
  // 登录
  login: async (data: LoginForm) => {
    if (isMockEnabled()) {
      return await mockService.login(data)
    }
    return http.post('/login', data)
  },
  
  // 登出
  logout: async () => {
    if (isMockEnabled()) {
      return await mockService.logout()
    }
    return http.post('/logout')
  },
  
  // 获取用户信息
  getUserInfo: async () => {
    if (isMockEnabled()) {
      const token = localStorage.getItem('token') || ''
      return await mockService.getUserInfo(token)
    }
    return http.get('/userInfo')
  },
  
  // 更新用户信息
  updateUser: async (data: Partial<User>) => {
    if (isMockEnabled()) {
      const token = localStorage.getItem('token') || ''
      return await mockService.updateUser(token, data)
    }
    return http.post('/updateUser', data)
  }
}