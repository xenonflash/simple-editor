import { mockUsers, generateMockToken, validateMockToken } from './user'
import type { LoginForm, User } from '@/api/user'

// Mock 延迟函数
function delay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Mock API 响应格式
function createMockResponse<T>(data: T, success: boolean = true, message: string = 'success') {
  return {
    code: success ? 200 : 400,
    message,
    data,
    success
  }
}

// Mock 服务
export const mockService = {
  // 登录
  async login(loginForm: LoginForm) {
    await delay(800) // 模拟网络延迟
    
    const user = mockUsers.find(u => 
      u.username === loginForm.username && u.password === loginForm.password
    )
    
    if (!user) {
      throw new Error('用户名或密码错误')
    }
    
    const token = generateMockToken(user.id)
    const { password, ...userInfo } = user
    
    return createMockResponse({
      token,
      user: userInfo
    })
  },
  
  // 登出
  async logout() {
    await delay(300)
    console.log('Mock: 用户已退出登录')
    return createMockResponse(null, true, '退出登录成功')
  },
  
  // 获取用户信息
  async getUserInfo(token: string) {
    await delay(400)
    
    const userId = validateMockToken(token)
    if (!userId) {
      const error = new Error('Token 无效')
      ;(error as any).response = { status: 401 }
      throw error
    }
    
    const user = mockUsers.find(u => u.id === userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    
    const { password, ...userInfo } = user
    return createMockResponse(userInfo)
  },
  
  // 更新用户信息
  async updateUser(token: string, updateData: Partial<User>) {
    await delay(600)
    
    const userId = validateMockToken(token)
    if (!userId) {
      const error = new Error('Token 无效')
      ;(error as any).response = { status: 401 }
      throw error
    }
    
    const userIndex = mockUsers.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      throw new Error('用户不存在')
    }
    
    // 更新用户信息（除了密码）
    const { password, ...validUpdateData } = updateData as any
    Object.assign(mockUsers[userIndex], validUpdateData)
    
    const { password: _, ...userInfo } = mockUsers[userIndex]
    return createMockResponse(userInfo)
  }
}

// 优化的 mock 启用判断逻辑
export function isMockEnabled(): boolean {
  // 1. 优先检查环境变量显式设置
  const mockEnv = import.meta.env.VITE_USE_MOCK
  if (mockEnv === 'true') return true
  if (mockEnv === 'false') return false
  
  // 2. 如果没有配置后端 API 地址，默认启用 mock
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  if (!apiBaseUrl) return true
  
  // 3. 开发环境默认启用 mock
  if (import.meta.env.DEV) return true
  
  // 4. 其他情况默认启用 mock（确保编译后能正常运行）
  return true
}