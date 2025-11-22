'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return
    if (password !== confirm) {
      alert('两次输入的密码不一致')
      return
    }
    // 本地模拟注册：其实就是直接当作登录，并把账号存在 localStorage
    login(username)
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-[#121212] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-black/60 border border-white/10 rounded-xl p-6 shadow-xl">
        <h1 className="text-xl font-bold mb-2 text-center">注册校园论坛账号</h1>
        <p className="text-xs text-gray-400 mb-6 text-center">
          本地模拟账号，仅当前浏览器有效
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">账号</label>
            <input
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入账号"
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
          <div>
            <label className="block text-xs text-gray-400 mb-1">确认密码</label>
            <input
              type="password"
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="请再次输入密码"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#0066CC] hover:bg-[#1a7be0] text-white text-sm py-2 rounded mt-2"
          >
            注册并登录
          </button>
        </form>
        <div className="text-xs text-gray-400 mt-4 text-center">
          已有账号？
          <Link href="/login" className="text-[#4da3ff] hover:underline ml-1">去登录</Link>
        </div>
        <div className="text-[11px] text-gray-500 mt-4 text-center">
          这是本地测试版账号系统，不会联网，也不会真正创建账号
        </div>
      </div>
    </main>
  )
}
