'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert('请输入有效的邮箱地址')
      return
    }
    
    if (username.length < 3) {
      alert('用户名至少需要3个字符')
      return
    }
    
    if (nickname.length < 2) {
      alert('昵称至少需要2个字符')
      return
    }
    
    if (password.length < 6) {
      alert('密码至少需要6个字符')
      return
    }
    
    if (password !== confirmPassword) {
      alert('两次输入的密码不一致')
      return
    }
    
    // 注册
    const result = register({ email, username, nickname, password })
    if (result.success) {
      alert(result.message)
      router.push('/')
    } else {
      alert(result.message)
    }
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
            <label className="block text-xs text-gray-400 mb-1">邮箱</label>
            <input
              type="email"
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">用户名（登录用）</label>
            <input
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="请输入用户名（用于登录）"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">昵称（显示用）</label>
            <input
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="请输入昵称（公开显示）"
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
              placeholder="请输入密码（至少6位）"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">确认密码</label>
            <input
              type="password"
              className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              required
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
