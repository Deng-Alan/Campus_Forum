'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证指定的管理员账号
    if (username === 'AlanDeng' && password === 'dwb918112') {
      Cookies.set('admin_token', 'true', { expires: 1 })
      router.push('/admin')
    } else {
      setError('账号或密码错误')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-8 rounded-lg border border-neutral-800 bg-neutral-900">
        <h1 className="text-2xl font-bold mb-6 text-center">管理员登录</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">账号</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black border border-neutral-700 rounded p-2 focus:border-blue-500 outline-none"
              placeholder="请输入管理员账号"
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
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  )
}
