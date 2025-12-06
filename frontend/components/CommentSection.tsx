'use client'

import { useState, useEffect } from 'react'
import { Heart, Send } from 'lucide-react'
import { Comment } from '@/types'
import { apiGet, apiPost } from '@/lib/api'
import { filterContent } from '@/lib/content-filter'
import clsx from 'clsx'

interface CommentSectionProps {
  postId: string
  isOpen: boolean
}

export function CommentSection({ postId, isOpen }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchComments()
    }
  }, [isOpen, postId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const data = await apiGet<{
        list: {
          id: string
          postId: string
          content: string
          authorName: string
          likes: number
          createdAt: string
        }[]
        total: number
        page: number
        size: number
      }>(`/posts/${postId}/comments`, { page: 1, size: 100 })

      const mapped: Comment[] = (data.list || []).map(item => ({
        id: item.id,
        post_id: item.postId,
        content: item.content,
        author_name: item.authorName,
        likes: item.likes ?? 0,
        created_at: item.createdAt,
      }))

      setComments(mapped)
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    // 内容过滤
    const filtered = filterContent(newComment)
    if (filtered.hasSensitiveContent) {
      alert('评论内容包含敏感信息，无法发布')
      return
    }

    setSubmitting(true)
    try {
      await apiPost<void>(`/posts/${postId}/comments`, {
        content: filtered.text,
      })

      setNewComment('')
      fetchComments()
    } catch (error) {
      console.error('Error creating comment:', error)
      alert('评论发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (commentId: string) => {
    try {
      const data = await apiPost<{ likes: number }>(`/comments/${commentId}/like`)
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, likes: data.likes } : c
      ))
    } catch (err) {
      console.error('Error liking comment:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="mt-4 pt-4 border-t border-white/10">
      {/* 评论列表 */}
      {loading ? (
        <div className="text-center text-gray-500 py-4 text-sm">加载评论中...</div>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.length === 0 ? (
            <div className="text-center text-gray-500 py-4 text-sm">暂无评论，快来抢沙发！</div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-black/30 rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-blue-400">{comment.author_name}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleString('zh-CN', { 
                      month: 'numeric', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-200 mb-2">{comment.content}</p>
                <button
                  onClick={() => handleLike(comment.id)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Heart size={14} className={clsx(comment.likes > 0 && "fill-red-900/30 text-red-400")} />
                  <span>{comment.likes || '赞'}</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* 发表评论表单 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="写下你的评论..."
          className="flex-1 bg-black/50 border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors flex items-center gap-1"
        >
          <Send size={14} />
          {submitting ? '...' : '发送'}
        </button>
      </form>
    </div>
  )
}
