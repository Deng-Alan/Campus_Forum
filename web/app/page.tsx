'use client'

import { useEffect, useState } from 'react'
import { PostCard } from '@/components/PostCard'
import { CreatePost } from '@/components/CreatePost'
import { Leaderboard } from '@/components/Leaderboard'
import { UserSettings } from '@/components/UserSettings'
import { supabase } from '@/lib/supabase'
import { Post, CreatePostDTO } from '@/types'

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('is_featured', { ascending: false }) // 精选置顶
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching posts:', error)
        setPosts(MOCK_POSTS)
      } else {
        setPosts(data || [])
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setPosts(MOCK_POSTS)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (data: CreatePostDTO) => {
    // 简单的防刷屏限制 (前端 LocalStorage 模拟)
    const lastPostTime = localStorage.getItem('last_post_time')
    if (lastPostTime && Date.now() - parseInt(lastPostTime) < 60000) {
      alert('发帖太快了，歇一歇吧！')
      return
    }

    const newPost = {
      content: data.content,
      author_name: data.author_name,
      type: data.type,
      subject: data.subject,
      image_url: data.image_url,
      likes: 0
    }

    try {
      const { error } = await supabase
        .from('posts')
        .insert([newPost])

      if (error) {
        console.error('Error creating post:', error)
        alert('发布失败：' + error.message)
      } else {
        localStorage.setItem('last_post_time', Date.now().toString())
        fetchPosts()
      }
    } catch (err) {
        console.error(err)
    }
  }

  const handleLike = async (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ))

    try {
      const { error } = await supabase.rpc('increment_likes', { row_id: postId })
      
      if (error) {
        console.error('Error liking post:', error)
        setPosts(posts.map(post => 
            post.id === postId ? { ...post, likes: post.likes - 1 } : post
        ))
      }
    } catch (err) {
      console.error('Error liking post:', err)
    }
  }

  return (
    <main className="min-h-screen bg-[#121212] text-white">
      {/* 顶部导航模拟 */}
      <nav className="sticky top-0 z-10 bg-[#121212]/80 backdrop-blur border-b border-white/10 mb-6">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="font-bold text-[#0066CC] text-lg">武冈三中论坛</div>
          <div className="flex gap-4 text-sm text-gray-400">
            <span className="text-white font-medium cursor-pointer">首页</span>
            <span className="hover:text-white cursor-pointer">表白墙</span>
            <span className="hover:text-white cursor-pointer">学习互助</span>
            <span className="hover:text-white cursor-pointer">我的</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧主要内容区 (占 2/3) */}
        <div className="md:col-span-2">
          <header className="mb-6">
            <h1 className="text-2xl font-bold mb-1 text-white">最新动态</h1>
            <p className="text-gray-400 text-sm">看看同学们都在聊什么</p>
          </header>

          <CreatePost onSubmit={handleCreatePost} />

          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-500 py-10">加载中...</div>
            ) : (
              <>
                {posts.length === 0 && (
                  <div className="text-center text-gray-500 py-10">暂时没有帖子，快来发布第一条吧！</div>
                )}
                {posts.map(post => (
                  <PostCard key={post.id} post={post} onLike={handleLike} />
                ))}
              </>
            )}
          </div>
        </div>

        {/* 右侧侧边栏 (占 1/3) */}
        <div className="hidden md:block space-y-6">
          {/* 用户设置组件 */}
          <UserSettings />

          {/* 公告卡片 */}
          <div className="bg-neutral-900 border border-white/10 rounded-lg p-4">
             <h3 className="font-bold text-white mb-3">📢 校园公告</h3>
             <ul className="space-y-2 text-sm text-gray-300">
               <li className="flex gap-2">
                 <span className="text-red-400 font-bold">置顶</span>
                 <span>下周一举行期中表彰大会</span>
               </li>
               <li className="flex gap-2">
                 <span className="text-blue-400">通知</span>
                 <span>图书馆新书上架，欢迎借阅</span>
               </li>
               <li className="flex gap-2">
                 <span className="text-blue-400">通知</span>
                 <span>本周五下午大扫除</span>
               </li>
             </ul>
          </div>

          {/* 排行榜组件 */}
          <Leaderboard />
          
          <div className="text-xs text-center text-gray-600 mt-8">
            武冈三中校园论坛 © 2025 <br/>
            Designed for Students
          </div>
        </div>
      </div>
    </main>
  )
}

// 模拟数据升级
const MOCK_POSTS: Post[] = [
  {
    id: '1',
    content: '欢迎来到武冈三中新版论坛！大家可以在这里畅所欲言。',
    author_name: '管理员',
    type: 'campus_fun',
    created_at: new Date().toISOString(),
    likes: 10,
    is_featured: true
  },
  {
    id: '2',
    content: '这道几何题怎么做呀？求学霸指点！(附图)',
    author_name: '初二某同学',
    type: 'study_help',
    subject: '数学',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    likes: 5
  }
]
