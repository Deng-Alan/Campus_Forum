'use client'

import { useEffect, useState } from 'react'
import { PostCard } from '@/components/PostCard'
import { UserSettings } from '@/components/UserSettings'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types'
import { useUser } from '@/hooks/useUser'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, History, LogOut } from 'lucide-react'

export default function MyPosts() {
  const { getPostIds } = useUser()
  const { logout } = useAuth()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyPosts()
  }, [])

  const fetchMyPosts = async () => {
    setLoading(true)
    try {
      const myIds = getPostIds()
      
      if (myIds.length === 0) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .in('id', myIds)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching my posts:', error)
      } else {
        setPosts(data || [])
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (postId: string) => {
    // 在这个页面也支持点赞，但只更新本地状态
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ))
    try {
      await supabase.rpc('increment_likes', { row_id: postId })
    } catch (e) {
      console.error(e)
    }
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
              <p className="text-sm text-gray-400 mb-4">共找到 {posts.length} 条记录</p>
              {posts.map(post => (
                <PostCard key={post.id} post={post} onLike={handleLike} />
              ))}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
