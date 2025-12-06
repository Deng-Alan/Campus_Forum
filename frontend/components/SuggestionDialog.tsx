'use client'

import { useState } from 'react'
import { X, Lightbulb, Bug, TrendingUp, MessageSquare } from 'lucide-react'
import { SuggestionCategory } from '@/types'
import { apiPost } from '@/lib/api'

interface SuggestionDialogProps {
  onClose: () => void
  onSuccess: () => void
}

const categories: { value: SuggestionCategory; label: string; icon: any; desc: string }[] = [
  { value: 'feature', label: '功能建议', icon: Lightbulb, desc: '新功能或改进建议' },
  { value: 'bug', label: 'Bug 反馈', icon: Bug, desc: '发现的问题或错误' },
  { value: 'improvement', label: '体验优化', icon: TrendingUp, desc: '用户体验改进' },
  { value: 'general', label: '其他建议', icon: MessageSquare, desc: '其他意见或建议' }
]

export function SuggestionDialog({ onClose, onSuccess }: SuggestionDialogProps) {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<SuggestionCategory>('general')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      setError('请填写建议内容')
      return
    }

    setLoading(true)
    setError('')

    try {
      await apiPost<void>('/suggestions', {
        content: content.trim(),
        category,
        isAnonymous,
      })

      alert('感谢您的反馈！我们会认真考虑您的建议')
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Submit suggestion error:', err)
      setError(err.message || '提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg max-w-md w-full p-6 border border-neutral-800 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">意见反馈</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit}>
          {/* 类别选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-3">
              反馈类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`p-3 rounded border-2 transition-all text-left ${
                      category === cat.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{cat.label}</span>
                    </div>
                    <p className="text-xs text-gray-400">{cat.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 内容输入 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              详细描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                category === 'bug' 
                  ? '请描述问题发生的步骤和现象...'
                  : '请详细描述您的建议或想法...'
              }
              className="w-full bg-black border border-neutral-700 rounded p-3 min-h-[150px] focus:border-blue-500 outline-none resize-none"
              disabled={loading}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {content.length}/1000
            </p>
          </div>

          {/* 匿名选项 */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded"
                disabled={loading}
              />
              <span className="text-sm">匿名提交</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              匿名提交后管理员无法看到您的身份
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* 按钮 */}
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
              disabled={loading || !content.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '提交中...' : '提交反馈'}
            </button>
          </div>
        </form>

        {/* 提示 */}
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded">
          <p className="text-xs text-green-400">
            ✨ 您的每一条反馈都对我们很重要！感谢您帮助我们改进
          </p>
        </div>
      </div>
    </div>
  )
}
