// src/utils/http.ts
import axios from 'axios'
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

// 定义响应数据接口
interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

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
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一处理响应和错误
http.interceptors.response.use(
  //@ts-ignore
  (response: AxiosResponse<ApiResponse>): Promise<ApiResponse> => {
    const { data } = response
    
    // 检查业务状态码
    if (data.code === 200 || data.success) {
      // 成功响应，返回数据部分
      return Promise.resolve(data)
    } else {
      // 业务逻辑错误
      console.error('业务错误:', data.message)
      
      // 根据错误码进行特殊处理
      switch (data.code) {
        case 401:
          // 未授权，清除token并跳转登录
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          // 权限不足
          console.warn('权限不足:', data.message)
          break
        case 404:
          // 资源不存在
          console.warn('资源不存在:', data.message)
          break
        case 500:
          // 服务器错误
          console.error('服务器错误:', data.message)
          break
        default:
          console.error('未知错误:', data.message)
      }
      
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  (error) => {
    console.error('响应拦截器错误:', error)
    
    // 网络错误处理
    if (error.response) {
      // 服务器响应了错误状态码
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          console.error('请求参数错误:', data?.message || '请求参数错误')
          break
        case 401:
          console.error('未授权访问')
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
        case 502:
          console.error('网关错误')
          break
        case 503:
          console.error('服务不可用')
          break
        default:
          console.error(`HTTP错误: ${status}`, data?.message || '未知错误')
      }
      
      return Promise.reject(new Error(data?.message || `HTTP ${status} 错误`))
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络连接错误，请检查网络设置')
      return Promise.reject(new Error('网络连接错误，请检查网络设置'))
    } else {
      // 请求配置错误
      console.error('请求配置错误:', error.message)
      return Promise.reject(new Error('请求配置错误'))
    }
  }
)

// 导出封装的请求方法
export const request = {
  get<T = any>(url: string, params?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return http.get(url, { params })
  },
  
  post<T = any>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return http.post(url, data)
  },
  
  put<T = any>(url: string, data?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return http.put(url, data)
  },
  
  delete<T = any>(url: string, params?: any): Promise<AxiosResponse<ApiResponse<T>>> {
    return http.delete(url, { params })
  }
}

export default http