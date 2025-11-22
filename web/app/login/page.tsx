'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usernameOrEmail.trim()) {
      alert('请输入用户名或邮箱')
      return
    }
    if (!password.trim()) {
      alert('请输入密码')
      return
    }
    
    const result = await login({ usernameOrEmail, password })
    if (result.success) {
      router.push('/')
    } else {
      alert(result.message)
    }
  }

  return (
    <main className="min-h-screen bg-[#121212] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-black/60 border border-white/10 rounded-xl p-6 shadow-xl">
        <h1 className="text-xl font-bold mb-2 text-center">登录校园论坛</h1>
        <p className="text-xs text-gray-400 mb-6 text-center">
          本地模拟账号，仅当前浏览器有效
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">用户名或邮箱</label>
            <input
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white"
              value={usernameOrEmail}
              onChange={e => setUsernameOrEmail(e.target.value)}
              placeholder="请输入用户名或邮箱"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">密码</label>
            <input
              type="password"
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#0066CC] hover:bg-[#1a7be0] text-white text-sm py-2 rounded mt-2"
          >
            登录
          </button>
        </form>
        <div className="text-xs text-gray-400 mt-4 text-center">
          还没有账号？
          <Link href="/register" className="text-[#4da3ff] hover:underline ml-1">去注册</Link>
        </div>
        <div className="text-[11px] text-gray-500 mt-4 text-center">
          这是本地测试版账号系统，不会联网，也不会真正创建账号
        </div>
      </div>
    </main>
  )
}
