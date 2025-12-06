'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Post } from '@/types'
import { apiPost } from '@/lib/api'

interface AppealDialogProps {
  post: Post
  onClose: () => void
  onSuccess: () => void
}

export function AppealDialog({ post, onClose, onSuccess }: AppealDialogProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reason.trim()) {
      setError('请填写申诉理由')
      return
    }

    setLoading(true)
    setError('')

    try {
      await apiPost<void>('/appeals', {
        postId: post.id,
        reason: reason.trim(),
      })

      alert('申诉已提交，请等待管理员处理')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Submit appeal error:', err)
      setError(err.message || '提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg max-w-md w-full p-6 border border-neutral-800">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">申诉帖子</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 帖子信息 */}
        <div className="mb-4 p-3 bg-neutral-800 rounded">
          <p className="text-sm text-gray-400 mb-1">帖子内容</p>
          <p className="text-sm line-clamp-3">{post.content}</p>
          <p className="text-xs text-gray-500 mt-2">
            当前状态：
            {post.status === 'rejected' && '❌ 审核未通过'}
            {post.status === 'removed' && '⚠️ 已被下架'}
          </p>
        </div>

        {/* 申诉表单 */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              申诉理由 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请详细说明申诉理由，帮助管理员更好地了解情况..."
              className="w-full bg-black border border-neutral-700 rounded p-3 min-h-[120px] focus:border-blue-500 outline-none resize-none"
              disabled={loading}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {reason.length}/500
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '提交中...' : '提交申诉'}
            </button>
          </div>
        </form>

        {/* 提示 */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
          <p className="text-xs text-blue-400">
            💡 提示：管理员会在24小时内处理您的申诉，请耐心等待
          </p>
        </div>
      </div>
    </div>
  )
}
