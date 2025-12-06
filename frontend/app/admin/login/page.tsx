'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { apiPost, saveTokens, clearTokens } from '@/lib/api'

interface LoginResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  user: {
    id: string
    username: string
    nickname: string
    email: string
    role: string
  }
}

export default function AdminLogin() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const resp = await apiPost<LoginResponse>('/auth/login', {
        usernameOrEmail,
        password,
      })

      if (!resp.user || resp.user.role !== 'admin') {
        // 非管理员账号，不允许进入后台
        clearTokens()
        setError('您不是管理员，无权访问')
        setLoading(false)
        return
      }

      // 保存 Token，后续 /admin 接口依赖 Authorization 头
      saveTokens(resp.accessToken, resp.refreshToken)

      // 标记管理员登录状态（仅用于前端路由守卫）
      Cookies.set('admin_token', 'true', { expires: 1 })
      router.push('/admin')
    } catch (err: any) {
      setError(err?.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-8 rounded-lg border border-neutral-800 bg-neutral-900">
        <h1 className="text-2xl font-bold mb-6 text-center">管理员登录</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">用户名或邮箱</label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              className="w-full bg-black border border-neutral-700 rounded p-2 focus:border-blue-500 outline-none"
              placeholder="请输入用户名或邮箱"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-neutral-700 rounded p-2 focus:border-blue-500 outline-none"
              placeholder="请输入密码"
              required
              disabled={loading}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登录'}
          </button>
          <p className="text-xs text-gray-500 mt-4 text-center">
            仅限论坛管理员登录 · 支持用户名或邮箱
          </p>
        </form>
      </div>
    </div>
  )
}
