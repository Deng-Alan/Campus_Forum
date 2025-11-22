import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

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

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setIsLoaded(true)
      }
    })

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setUser(null)
        setIsLoaded(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data && !error) {
      setUser({
        userId: data.id,
        username: data.username,
        nickname: data.nickname,
        email: '', // Supabase Auth 管理邮箱
        avatar: data.avatar
      })
    }
    setIsLoaded(true)
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    try {
      // 使用 Supabase Auth 注册，触发器会自动创建 user_profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nickname: data.nickname,
            username: data.username
          }
        }
      })

      if (authError) {
        // 处理常见错误
        if (authError.message.includes('already registered')) {
          return { success: false, message: '该邮箱已被注册' }
        }
        if (authError.message.includes('duplicate')) {
          return { success: false, message: '用户名或邮箱已存在' }
        }
        return { success: false, message: authError.message }
      }

      if (!authData.user) {
        return { success: false, message: '注册失败，请重试' }
      }

      return { success: true, message: '注册成功！' }
    } catch (error: any) {
      console.error('Registration error:', error)
      return { success: false, message: error.message || '注册失败，请重试' }
    }
  }

  const login = async (data: LoginData): Promise<{ success: boolean; message: string }> => {
    try {
      let email = data.usernameOrEmail
      
      // 如果不包含@，说明是用户名，需要查询邮箱
      if (!email.includes('@')) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('username', data.usernameOrEmail)
          .single()
        
        if (!profile || !profile.email) {
          return { success: false, message: '用户名不存在' }
        }

        email = profile.email
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: data.password
      })

      if (error) {
        return { success: false, message: '邮箱或密码错误' }
      }

      return { success: true, message: '登录成功' }
    } catch (error) {
      return { success: false, message: '登录失败，请重试' }
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const updateAvatar = async (avatarUrl: string) => {
    if (!user) return
    
    const { error } = await supabase
      .from('user_profiles')
      .update({ avatar: avatarUrl })
      .eq('id', user.userId)

    if (!error) {
      setUser({ ...user, avatar: avatarUrl })
    }
  }

  const updateUsername = async (newUsername: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: '未登录' }
    
    // 检查用户名是否已被占用
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', newUsername)
      .neq('id', user.userId)
      .single()
    
    if (existing) {
      return { success: false, message: '用户名已被占用' }
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ username: newUsername })
      .eq('id', user.userId)

    if (error) {
      return { success: false, message: '更新失败' }
    }

    setUser({ ...user, username: newUsername })
    return { success: true, message: '用户名更新成功' }
  }

  const updateNickname = async (newNickname: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: '未登录' }
    
    const { error } = await supabase
      .from('user_profiles')
      .update({ nickname: newNickname })
      .eq('id', user.userId)

    if (error) {
      return { success: false, message: '更新失败' }
    }

    setUser({ ...user, nickname: newNickname })
    return { success: true, message: '昵称更新成功' }
  }

  const updatePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: '未登录' }
    
    // Supabase Auth 更新密码
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      return { success: false, message: '密码更新失败' }
    }

    return { success: true, message: '密码更新成功' }
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
