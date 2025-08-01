// src/utils/http.ts
import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

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
  (config: AxiosRequestConfig) => {
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

// 响应拦截器 - 统一处理响应和错误
http.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response
    
    // 如果后端返回的数据结构是 { code, message, data }
    console.log(data)
    if (data.code !== undefined) {
      if (data.code == 200) {
        return data // 返回成功数据
      } else {
        // 业务错误
        return Promise.reject(new Error(data.message || '请求失败'))
      }
    }
    
    // 直接返回数据
    return data
  },
  (error) => {
    // HTTP 错误处理
    if (error.response) {
      const { status } = error.response
      switch (status) {
        case 401:
          // token 过期或无效，清除本地存储并跳转登录
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          console.error('权限不足')
          break
        case 404:
          console.error('请求的资源不存在')
          break
        case 500:
          console.error('服务器内部错误')
          break
        default:
          console.error(`请求错误: ${status}`)
      }
    } else if (error.request) {
      console.error('网络错误，请检查网络连接')
    } else {
      console.error('请求配置错误:', error.message)
    }
    
    return Promise.reject(error)
  }
)

export default http