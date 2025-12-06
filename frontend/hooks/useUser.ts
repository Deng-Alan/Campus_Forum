import { useState, useEffect } from 'react'
import { apiGet, apiPut } from '@/lib/api'
import { useAuth } from './useAuth'

export interface UserInfo {
  isAnonymous: boolean
}

export function useUser() {
  const { user: authUser } = useAuth()
  const [user, setUser] = useState<UserInfo>({
    isAnonymous: false
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // 从数据库加载用户偏好设置
  useEffect(() => {
    if (!authUser) {
      setIsLoaded(true)
      return
    }

    loadUserPreferences()
  }, [authUser])

  const loadUserPreferences = async () => {
    if (!authUser) return

    try {
      const data = await apiGet<{ isAnonymous: boolean }>('/users/preferences')
      setUser({ isAnonymous: !!data.isAnonymous })
    } catch {
      // 出错时保持默认配置
    } finally {
      setIsLoaded(true)
    }
  }

  // 切换匿名模式 - 保存到数据库
  const toggleAnonymous = async (isAnonymous: boolean) => {
    if (!authUser) return

    const newUser = { ...user, isAnonymous }
    setUser(newUser)

    // 更新数据库
    try {
      await apiPut<void>('/users/preferences', { isAnonymous })
    } catch {
      // 回滚本地状态（可选）
    }
  }

  // 获取显示名称（考虑匿名模式）
  const getDisplayName = () => {
    if (user.isAnonymous) {
      return '匿名同学'
    }
    return authUser?.nickname || '某位同学'
  }

  // 记录发帖 ID - 不再需要，直接从数据库查询
  const addPostId = (postId: string) => {
    // 已废弃：发帖时直接关联 user_id，不需要单独记录
    console.log('addPostId is deprecated, post is already linked to user')
  }

  // 获取所有发帖 ID - 从数据库查询
  const getPostIds = async (): Promise<string[]> => {
    if (!authUser) return []

    try {
      const data = await apiGet<{ list: { id: string }[]; total: number; page: number; size: number }>(
        '/posts/my',
        { page: 1, size: 100 }
      )
      return Array.isArray(data.list) ? data.list.map(p => p.id) : []
    } catch {
      return []
    }
  }

  return {
    user,
    isLoaded,
    toggleAnonymous,
    getDisplayName,
    addPostId, // 保留兼容性，但已废弃
    getPostIds
  }
}
