import { useEffect, useState } from 'react'

export interface AuthUser {
  username: string
  avatar?: string
}

const AUTH_STORAGE_KEY = 'campus_forum_auth_user'

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

  const login = (username: string) => {
    const authUser: AuthUser = { username }
    setUser(authUser)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser))
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
    }
  }

  return {
    user,
    isLoaded,
    login,
    logout,
    updateAvatar,
    isLoggedIn: !!user,
  }
}
