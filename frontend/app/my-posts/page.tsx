'use client'

import { useEffect, useState } from 'react'
import { PostCard } from '@/components/PostCard'
import { UserSettings } from '@/components/UserSettings'
import { AppealDialog } from '@/components/AppealDialog'
import { Post } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { apiGet, apiPost } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, History, LogOut } from 'lucide-react'

export default function MyPosts() {
  const { logout, user } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showAppeal, setShowAppeal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  useEffect(() => {
    fetchMyPosts()
  }, [user])

  const fetchMyPosts = async () => {
    setLoading(true)
    try {
      if (!user) {
        setLoading(false)
        return
      }

      const data = await apiGet<{
        list: {
          id: string
          content: string
          authorName: string
          avatarUrl?: string
          type: any
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
        }[]
        total: number
        page: number
        size: number
      }>('/posts/my', { page: 1, size: 100 })

      const mapped: Post[] = (data.list || []).map(item => ({
        id: item.id,
        content: item.content,
        author_name: item.authorName,
        created_at: item.createdAt,
        likes: item.likes ?? 0,
        type: item.type,
        image_url: item.imageUrl,
        avatar_url: item.avatarUrl,
        subject: item.subject,
        is_featured: item.isFeatured,
        review_status: item.reviewStatus,
        comment_count: item.commentCount,
        quoted_post_id: item.quotedPost?.id,
        quoted_post: item.quotedPost
          ? {
              id: item.quotedPost.id,
              content: item.quotedPost.content,
              author_name: item.quotedPost.authorName,
            }
          : undefined,
        status: item.status,
      }))

      setPosts(mapped)
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId))
  }

  const handleLike = async (postId: string) => {
    try {
      const data = await apiPost<{ likes: number }>(`/posts/${postId}/like`)
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, likes: data.likes } : post
      ))
    } catch (e) {
      console.error(e)
    }
  }

  const handleAppeal = (post: Post) => {
    setSelectedPost(post)
    setShowAppeal(true)
  }

  return (
    <main className="min-h-screen bg-[#121212] text-white p-4">
      <div className="max-w-3xl mx-auto">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <div className="flex items-center gap-2 text-xl font-bold text-[#0066CC]">
              <History />
              我的发帖历史
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400">
              在这里可以管理你的个人信息和历史发帖记录。
            </div>
            <Link
              href="/my-appeals"
              className="text-xs text-blue-400 hover:underline"
            >
              查看我的申诉记录
            </Link>
          </div>
          <button
            onClick={() => {
              logout()
              router.push('/')
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>

        {/* 个人信息 */}
        <UserSettings />

        {/* 帖子列表 */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-500 py-10">加载中...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-medium mb-2">还没有发布过帖子</h3>
              <p className="text-gray-500 mb-6">在首页发布的帖子会显示在这里</p>
              <Link 
                href="/"
                className="px-6 py-2 bg-[#0066CC] text-white rounded-full hover:bg-[#0052a3] transition-colors"
              >
                去发帖
              </Link>
            </div>
          ) : (
            <>
              <p className="text.sm text-gray-400 mb-4">共找到 {posts.length} 条记录</p>
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onDelete={handleDelete}
                  onAppeal={handleAppeal}
                />
              ))}
            </>
          )}
        </div>

        {/* 申诉对话框 */}
        {showAppeal && selectedPost && (
          <AppealDialog
            post={selectedPost}
            onClose={() => {
              setShowAppeal(false)
              setSelectedPost(null)
            }}
            onSuccess={fetchMyPosts}
          />
        )}
      </div>
    </main>
  )
}
