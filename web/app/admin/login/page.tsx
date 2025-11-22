'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Cookies from 'js-cookie'

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
      let email = usernameOrEmail
      
      // 如果不包含@，说明是用户名，需要查询邮箱
      if (!email.includes('@')) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('username', usernameOrEmail)
          .single()
        
        if (profileError || !profile?.email) {
          setError('用户名不存在')
          setLoading(false)
          return
        }

        email = profile.email
      }

      // 1. 使用 Supabase Auth 登录
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        setError('用户名/邮箱或密码错误')
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('登录失败')
        setLoading(false)
        return
      }

      // 2. 检查是否是管理员
      const { data: isAdminData, error: isAdminError } = await supabase
        .rpc('is_admin')

      if (isAdminError || !isAdminData) {
        // 不是管理员，退出登录
        await supabase.auth.signOut()
        setError('您不是管理员，无权访问')
        setLoading(false)
        return
      }

      // 3. 设置管理员 token
      Cookies.set('admin_token', 'true', { expires: 1 })
      router.push('/admin')
    } catch (err) {
      setError('登录失败，请重试')
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
              placeholder="AlanDeng 或 alandeng@admin.com"
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
            支持用户名或邮箱登录 · Supabase Auth
          </p>
        </form>
      </div>
    </div>
  )
}
