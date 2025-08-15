// Mock 用户数据
export const mockUsers = [
  {
    id: '1',
    username: 'admin',
    password: '123456',
    nickname: '管理员',
    email: 'admin@example.com',
    avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    username: 'user',
    password: '123456',
    nickname: '普通用户',
    email: 'user@example.com',
    avatar: 'https://avatars.githubusercontent.com/u/2?v=4',
    createdAt: '2024-01-01T00:00:00Z'
  }
]

// Mock token 生成
export function generateMockToken(userId: string): string {
  return `mock_token_${userId}_${Date.now()}`
}

// 验证 token
export function validateMockToken(token: string): string | null {
  if (token.startsWith('mock_token_')) {
    const parts = token.split('_')
    return parts[2] // 返回用户ID
  }
  return null
}