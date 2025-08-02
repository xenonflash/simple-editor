// src/utils/http.ts
import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

// 创建 axios 实例
const http: AxiosInstance = axios.create({
  baseURL: '/api', // 使用相对路径，通过 Vite 代理
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 自动添加 token
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器保持不变
http.interceptors.response.use(
  (response: AxiosResponse) => {
    // 响应处理逻辑
    return response
  },
  (error) => {
    // 错误处理逻辑
    return Promise.reject(error)
  }
)

export default http