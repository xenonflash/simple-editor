// src/api/user.ts
import http from '@/utils/http'

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
  login: (data: LoginForm) => http.post('/login', data),
  
  // 登出
  logout: () => http.post('/logout'),
  
  // 获取用户信息
  getUserInfo: () => http.get('/userInfo'),
  
  // 更新用户信息
  updateUser: (data: Partial<User>) => http.post('/updateUser', data)
}