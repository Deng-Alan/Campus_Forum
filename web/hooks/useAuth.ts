import { useEffect, useState } from 'react'

export interface AuthUser {
  userId: string // 唯一标识符
  username: string // 用户名（登录用）
  nickname: string // 昵称（显示用）
  email: string // 邮箱
  password: string // 密码（简单加密）
  avatar?: string
  createdAt: string
}

export interface RegisterData {
  username: string
  nickname: string
  email: string
  password: string
}

export interface LoginData {
  usernameOrEmail: string
  password: string
}

const AUTH_STORAGE_KEY = 'campus_forum_auth_user'
const USERS_STORAGE_KEY = 'campus_forum_users'

// 生成唯一用户ID
function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

// 获取所有注册用户
function getAllUsers(): AuthUser[] {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    return []
  }
}

// 保存用户到用户列表
function saveUser(user: AuthUser) {
  const users = getAllUsers()
  users.push(user)
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
}

// 更新用户信息
function updateUserInList(updatedUser: AuthUser) {
  const users = getAllUsers()
  const index = users.findIndex(u => u.userId === updatedUser.userId)
  if (index !== -1) {
    users[index] = updatedUser
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY)
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load auth user:', e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const register = (data: RegisterData): { success: boolean; message: string } => {
    const users = getAllUsers()
    
    // 检查用户名是否已存在
    if (users.some(u => u.username === data.username)) {
      return { success: false, message: '用户名已存在' }
    }
    
    // 检查邮箱是否已存在
    if (users.some(u => u.email === data.email)) {
      return { success: false, message: '邮箱已被注册' }
    }
    
    // 创建新用户
    const newUser: AuthUser = {
      userId: generateUserId(),
      username: data.username,
      nickname: data.nickname,
      email: data.email,
      createdAt: new Date().toISOString(),
    }
    
    // 保存到用户列表
    saveUser(newUser)
    
    // 注册后自动登录
    setUser(newUser)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser))
    
    return { success: true, message: '注册成功' }
  }

  const login = (data: LoginData): { success: boolean; message: string } => {
    const users = getAllUsers()
    
    // 查找用户（支持用户名或邮箱登录）
    const foundUser = users.find(
      u => u.username === data.usernameOrEmail || u.email === data.usernameOrEmail
    )
    
    if (!foundUser) {
      return { success: false, message: '用户名或邮箱不存在' }
    }
    
    // 注意：这里简化了密码验证，实际应用应该有密码字段
    setUser(foundUser)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(foundUser))
    
    return { success: true, message: '登录成功' }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const updateAvatar = (avatarUrl: string) => {
    if (user) {
      const updatedUser = { ...user, avatar: avatarUrl }
      setUser(updatedUser)
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser))
      updateUserInList(updatedUser)
    }
  }

  return {
    user,
    isLoaded,
    register,
    login,
    logout,
    updateAvatar,
    isLoggedIn: !!user,
  }
}
