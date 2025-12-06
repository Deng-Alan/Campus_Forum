'use client'

import { useState, useEffect } from 'react'
import { Send, Image as ImageIcon, AlertCircle, Quote, X } from 'lucide-react'
import { PostType, CreatePostDTO, Post } from '@/types'
import { filterContent } from '@/lib/content-filter'
import { ImageUpload } from './ImageUpload'
import { QuotePostSelector } from './QuotePostSelector'
import { useUser } from '@/hooks/useUser'
import { useAuth } from '@/hooks/useAuth'
import clsx from 'clsx'

interface CreatePostProps {
  onSubmit: (data: CreatePostDTO) => Promise<void>
  currentType: PostType
}

export function CreatePost({ onSubmit, currentType }: CreatePostProps) {
  const { getDisplayName } = useUser()
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const type = currentType // 使用传入的板块类型
  const [subject, setSubject] = useState('数学') // 默认数学
  const [imageUrl, setImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quotedPost, setQuotedPost] = useState<Post | null>(null)
  const [showQuoteSelector, setShowQuoteSelector] = useState(false)
  
  // 过滤反馈状态
  const [filterFeedback, setFilterFeedback] = useState<{ hasSensitive: boolean; replaced: string[] }>({ hasSensitive: false, replaced: [] })

  // 实时检测内容
  useEffect(() => {
    if (!content) {
      setFilterFeedback({ hasSensitive: false, replaced: [] })
      return
    }
    
    const result = filterContent(content)
    setFilterFeedback({
      hasSensitive: result.hasSensitiveContent,
      replaced: result.replacedWords
    })
  }, [content])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed || isSubmitting || filterFeedback.hasSensitive) return

    if (trimmed.length > 5000) {
      alert('帖子内容长度不能超过5000个字符')
      return
    }

    setIsSubmitting(true)
    try {
      // 最终提交前再过滤一次（虽然数据库也有触发器，前端先处理体验更好）
      const filteredResult = filterContent(trimmed)
      
      await onSubmit({
        content: filteredResult.text,
        author_name: type === 'anonymous' || type === 'confession' ? '匿名同学' : getDisplayName(),
        type,
        image_url: imageUrl || undefined,
        subject: type === 'study_help' ? subject : undefined,
        quoted_post_id: quotedPost?.id
      })
      
      setContent('')
      setImageUrl('')
      setQuotedPost(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mb-8 bg-neutral-900 p-4 rounded-lg border border-white/10">
      <form onSubmit={handleSubmit}>
        <div className="relative">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  type === 'campus_fun' ? "分享你的校园新鲜事..." :
                  type === 'study_help' ? "写下你的问题，让同学们来帮助你..." :
                  type === 'confession' ? "写下你想说的话，可以是感谢、祝福..." :
                  type === 'anonymous' ? "这里只有你和树洞，说出你的秘密..." :
                  "分享你的校园新鲜事..."
                }
                className={clsx(
                    "w-full bg-black border rounded-md p-3 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 min-h-[100px] resize-y transition-colors",
                    filterFeedback.hasSensitive ? "border-red-500 focus:border-red-500" : "border-neutral-800"
                )}
            />
            
            {/* 过滤提示浮层 */}
            {(filterFeedback.hasSensitive || filterFeedback.replaced.length > 0) && (
                <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur text-xs rounded px-2 py-1 border border-white/10">
                    {filterFeedback.hasSensitive ? (
                        <span className="text-red-400 flex items-center gap-1">
                            <AlertCircle size={12} />
                            内容包含敏感信息，无法发布
                        </span>
                    ) : (
                        <span className="text-yellow-500">
                            将自动替换: {filterFeedback.replaced.join(', ')}
                        </span>
                    )}
                </div>
            )}
        </div>

        {/* 引用的帖子预览 */}
        {quotedPost && (
          <div className="mt-3 bg-neutral-800 border border-neutral-700 rounded p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Quote className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">引用帖子</span>
              </div>
              <button
                type="button"
                onClick={() => setQuotedPost(null)}
                className="p-1 hover:bg-neutral-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="pl-6 border-l-2 border-blue-500">
              <p className="text-sm text-gray-400 mb-1">{quotedPost.author_name}</p>
              <p className="text-sm line-clamp-2">{quotedPost.content}</p>
            </div>
          </div>
        )}

        {/* 额外字段区域 */}
        <div className="mt-3 space-y-3">
            {type === 'study_help' && (
                <select 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-neutral-800 text-sm text-white rounded px-3 py-2 border border-neutral-700 outline-none focus:border-blue-500"
                >
                    {['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治'].map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            )}
            
            {/* 图片上传组件 */}
            {(type === 'campus_fun' || type === 'study_help') && (
                <ImageUpload 
                    onImageUploaded={setImageUrl}
                    currentImage={imageUrl}
                    onRemove={() => setImageUrl('')}
                />
            )}
        </div>

        <div className="flex justify-between items-center mt-4">
          {/* 引用按钮 */}
          <button
            type="button"
            onClick={() => setShowQuoteSelector(true)}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full transition-colors text-sm"
          >
            <Quote size={16} />
            引用帖子
          </button>

          {/* 发布按钮 */}
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting || filterFeedback.hasSensitive}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors text-sm font-medium"
          >
            <Send size={16} />
            {isSubmitting ? '发布中...' : '发布'}
          </button>
        </div>

        {/* 引用帖子选择器 */}
        {showQuoteSelector && (
          <QuotePostSelector
            onSelect={setQuotedPost}
            onClose={() => setShowQuoteSelector(false)}
            currentUserId={user?.userId}
          />
        )}
      </form>
    </div>
  )
}
