import { useState, useEffect } from 'react'

export interface UserInfo {
  nickname: string
  isAnonymous: boolean
}

const STORAGE_KEY = 'campus_forum_user'
const DEFAULT_NICKNAME = '某位同学'

export function useUser() {
  const [user, setUser] = useState<UserInfo>({
    nickname: DEFAULT_NICKNAME,
    isAnonymous: false
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // 从 localStorage 加载用户信息
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed)
      } catch (err) {
        console.error('Failed to parse user data:', err)
      }
    }
    setIsLoaded(true)
  }, [])

  // 更新昵称
  const updateNickname = (nickname: string) => {
    const newUser = { ...user, nickname }
    setUser(newUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
  }

  // 切换匿名模式
  const toggleAnonymous = (isAnonymous: boolean) => {
    const newUser = { ...user, isAnonymous }
    setUser(newUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
  }

  // 获取显示名称（考虑匿名模式）
  const getDisplayName = () => {
    if (user.isAnonymous) {
      return '匿名同学'
    }
    return user.nickname || DEFAULT_NICKNAME
  }

  return {
    user,
    isLoaded,
    updateNickname,
    toggleAnonymous,
    getDisplayName
  }
}
