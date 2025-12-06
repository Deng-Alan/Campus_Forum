'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiGet, apiPost } from '@/lib/api'
import { Post, PostType } from '@/types'
import { PostCard } from '@/components/PostCard'
import { AppealDialog } from '@/components/AppealDialog'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface PostDetailResponse {
  id: string
  content: string
  authorName: string
  avatarUrl?: string
  type: PostType
  subject?: string
  imageUrl?: string
  likes: number
  commentCount: number
  isFeatured: boolean
  reviewStatus: 'pending' | 'approved' | 'rejected'
  status: 'pending' | 'approved' | 'rejected' | 'removed'
  quotedPost?: {
    id: string
    content: string
    authorName: string
  }
  createdAt: string
}

export default function PostDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAppeal, setShowAppeal] = useState(false)

  useEffect(() => {
    const id = params?.id
    if (!id) return
    fetchPost(String(id))
  }, [params])

  const fetchPost = async (id: string) => {
    setLoading(true)
    try {
      const data = await apiGet<PostDetailResponse>(`/posts/${id}`)
      const mapped: Post = {
        id: data.id,
        content: data.content,
        author_name: data.authorName,
        created_at: data.createdAt,
        likes: data.likes ?? 0,
        type: data.type,
        image_url: data.imageUrl,
        avatar_url: data.avatarUrl,
        subject: data.subject,
        is_featured: data.isFeatured,
        review_status: data.reviewStatus,
        comment_count: data.commentCount,
        quoted_post_id: data.quotedPost?.id,
        quoted_post: data.quotedPost
          ? {
              id: data.quotedPost.id,
              content: data.quotedPost.content,
              author_name: data.quotedPost.authorName,
            }
          : undefined,
        status: data.status,
      }
      setPost(mapped)
    } catch (error) {
      console.error('Fetch post error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string) => {
    if (!isLoggedIn) {
      alert('请先登录后再点赞')
      return
    }
    try {
      const data = await apiPost<{ likes: number }>(`/posts/${postId}/like`)
      setPost(prev => {
        if (!prev) return prev
        return { ...prev, likes: data.likes }
      })
    } catch (error) {
      console.error('Like post error:', error)
    }
  }

  const handleAppeal = (p: Post) => {
    setPost(p)
    setShowAppeal(true)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#121212] text-white flex items-center justify.center">
        <div className="text-gray-500">加载中...</div>
      </main>
    )
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-[#121212] text-white flex items-center justify.center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">帖子不存在或已被删除。</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[#0066CC] rounded-full text-sm"
          >
            返回首页
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#121212] text-white">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-bold text-white/90">帖子详情</h1>
        </div>

        <PostCard
          post={post}
          onLike={handleLike}
          onAppeal={handleAppeal}
        />
      </div>

      {showAppeal && post && (
        <AppealDialog
          post={post}
          onClose={() => setShowAppeal(false)}
          onSuccess={() => fetchPost(post.id)}
        />
      )}
    </main>
  )
}
