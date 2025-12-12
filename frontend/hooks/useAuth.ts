import { useState, useEffect } from 'react'
import { apiGet, apiPost, apiPut, saveTokens, clearTokens } from '@/lib/api'

export interface AuthUser {
  userId: string
  username: string
  nickname: string
  email: string
  avatar?: string
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

interface BackendUser {
  id: string
  username: string
  nickname: string
  email: string
  avatar?: string
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: BackendUser
}

function mapUser(data: BackendUser): AuthUser {
  return {
    userId: data.id,
    username: data.username,
    nickname: data.nickname,
    email: data.email,
    avatar: data.avatar,
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 获取当前会话
    loadUserProfile()

    // 监听认证状态变化
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'cf_access_token') {
        if (event.newValue) {
          loadUserProfile()
        } else {
          setUser(null)
          setIsLoaded(true)
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage)
      }
    }
  }, [])

  const loadUserProfile = async () => {
    try {
      const data = await apiGet<BackendUser>('/auth/me')
      setUser({
        userId: data.id,
        username: data.username,
        nickname: data.nickname,
        email: data.email,
        avatar: data.avatar
      })
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setIsLoaded(true)
    }
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    try {
      // 调用后端注册接口
      await apiPost<void>('/auth/register', {
        username: data.username,
        nickname: data.nickname,
        email: data.email,
        password: data.password,
        confirmPassword: data.password,
        role: 'student',
      })

      // 处理常见错误
      return { success: true, message: '注册成功！' }
    } catch (error: any) {
      console.error('Registration error:', error)
      return { success: false, message: error.message || '注册失败，请重试' }
    }
  }

  const login = async (data: LoginData): Promise<{ success: boolean; message: string }> => {
    try {
      let usernameOrEmail = data.usernameOrEmail
      
      // 如果不包含@，说明是用户名，需要查询邮箱
      const resp = await apiPost<LoginResponse>('/auth/login', {
        usernameOrEmail,
        password: data.password,
      })

      saveTokens(resp.accessToken, resp.refreshToken)
      setUser(mapUser(resp.user))

      return { success: true, message: '登录成功' }
    } catch (error: any) {
      return { success: false, message: error.message || '登录失败，请重试' }
    }
  }

  const logout = async () => {
    try {
      await apiPost<void>('/auth/logout')
    } catch {
      // ignore
    } finally {
      clearTokens()
      setUser(null)
    }
  }

  const updateAvatar = async (avatarUrl: string) => {
    if (!user) return
    try {
      await apiPut<void>('/users/me', { avatar: avatarUrl })
      setUser({ ...user, avatar: avatarUrl })
    } catch {
    }
  }

  const updateUsername = async (newUsername: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: '未登录' }
    return { success: false, message: '当前暂不支持修改用户名，请联系管理员' }
  }

  const updateNickname = async (newNickname: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: '未登录' }
    try {
      await apiPut<void>('/users/me', { nickname: newNickname })
      setUser({ ...user, nickname: newNickname })
      return { success: true, message: '昵称更新成功' }
    } catch (error: any) {
      return { success: false, message: error?.message || '更新失败' }
    }
  }

  const updatePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: '未登录' }
    try {
      await apiPut<void>('/auth/password', { oldPassword, newPassword })
      return { success: true, message: '密码更新成功' }
    } catch (error: any) {
      return { success: false, message: error?.message || '密码更新失败' }
    }
  }

  return {
    user,
    isLoaded,
    register,
    login,
    logout,
    updateAvatar,
    updateUsername,
    updateNickname,
    updatePassword,
    isLoggedIn: !!user,
  }
}
