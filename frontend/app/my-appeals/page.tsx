'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { apiGet } from '@/lib/api'
import { ArrowLeft, History, AlertTriangle, Clock } from 'lucide-react'

interface AppealItem {
  id: string
  postId: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  adminResponse?: string | null
  createdAt: string
}

export default function MyAppealsPage() {
  const { isLoaded, isLoggedIn } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [appeals, setAppeals] = useState<AppealItem[]>([])

  useEffect(() => {
    if (!isLoaded) return
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    fetchAppeals()
  }, [isLoaded, isLoggedIn])

  const fetchAppeals = async () => {
    setLoading(true)
    try {
      const data = await apiGet<{ list: {
        id: string
        postId: string
        reason: string
        status: 'pending' | 'approved' | 'rejected'
        adminResponse?: string | null
        createdAt: string
      }[]; total: number; page: number; size: number }>('/appeals/my', { page: 1, size: 50 })
      setAppeals(data.list || [])
    } catch (error) {
      console.error('Fetch appeals error:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStatus = (status: AppealItem['status']) => {
    if (status === 'pending') return <span className="text-yellow-400 text-xs">待处理</span>
    if (status === 'approved') return <span className="text-green-400 text-xs">已通过</span>
    return <span className="text-red-400 text-xs">已驳回</span>
  }

  return (
    <main className="min-h-screen bg-[#121212] text-white p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link href="/my-posts" className="p-2 hover:bg.white/10 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div className="flex items-center gap-2 text-xl font-bold text-[#0066CC]">
              <History />
              我的申诉记录
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-10">加载中...</div>
        ) : appeals.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-4 flex justify-center">
              <AlertTriangle size={48} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">还没有申诉记录</h3>
            <p className="text-gray-500 mb-6 text-sm">当你的帖子被拒绝或下架后，可以在帖子卡片中发起申诉。</p>
            <Link
              href="/"
              className="px-6 py-2 bg-[#0066CC] text.white rounded-full hover:bg-[#0052a3] transition-colors text-sm"
            >
              返回首页
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appeals.map(item => (
              <div key={item.id} className="bg-neutral-900 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Clock size={14} />
                    <span>{new Date(item.createdAt).toLocaleString('zh-CN', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}</span>
                  </div>
                  {renderStatus(item.status)}
                </div>
                <div className="text-sm text-gray-200 mb-2">
                  <span className="text-gray-500 mr-1">申诉帖子：</span>
                  <Link
                    href={`/post/${item.postId}`}
                    className="text-blue-400 hover:underline"
                  >
                    查看帖子
                  </Link>
                </div>
                <div className="text-sm text-gray-200 mb-2">
                  <span className="text-gray-500 mr-1">申诉理由：</span>
                  <span>{item.reason}</span>
                </div>
                {item.adminResponse && (
                  <div className="text-sm text-gray-200 mt-2 border-t border-white/10 pt-2">
                    <span className="text-gray-500 mr-1">管理员回复：</span>
                    <span>{item.adminResponse}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
