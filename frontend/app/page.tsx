'use client'

import { useEffect, useState } from 'react'
import { PostCard } from '@/components/PostCard'
import { CreatePost } from '@/components/CreatePost'
import { Leaderboard } from '@/components/Leaderboard'
import { UserSettings } from '@/components/UserSettings'
import { AppealDialog } from '@/components/AppealDialog'
import { SuggestionDialog } from '@/components/SuggestionDialog'
import { supabase } from '@/lib/supabase'
import { Post, CreatePostDTO, Announcement, PostType } from '@/types'
import clsx from 'clsx'
import { useUser } from '@/hooks/useUser'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { MessageSquarePlus } from 'lucide-react'

export default function Home() {
  const { addPostId } = useUser()
  const { isLoggedIn, user, logout } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'campus_fun' | 'study_help' | 'confession' | 'anonymous'>('all')
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null) // 学科筛选
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [showAppeal, setShowAppeal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  useEffect(() => {
    // 切换 Tab 时重置学科筛选
    if (activeTab !== 'study_help') {
      setSubjectFilter(null)
    }
    fetchPosts(activeTab, { subject: subjectFilter })
    fetchAnnouncements()

    const postIntervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchPosts(activeTab, { silent: true, subject: subjectFilter })
      }
    }, 20000)

    const annIntervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchAnnouncements()
      }
    }, 30000)

    return () => {
      clearInterval(postIntervalId)
      clearInterval(annIntervalId)
    }
  }, [activeTab, subjectFilter])

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_top', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5)

      if (!error && data) {
        setAnnouncements(data)
      }
    } catch (err) {
      console.error('Error fetching announcements:', err)
    }
  }

  const handleAppeal = (post: Post) => {
    setSelectedPost(post)
    setShowAppeal(true)
  }

  const fetchPosts = async (type: string, options?: { silent?: boolean; subject?: string | null }) => {
    if (!options?.silent) {
      setLoading(true)
    }
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          quoted_post:quoted_post_id (
            id,
            content,
            author_name,
            created_at
          )
        `)
        .eq('review_status', 'approved')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })

      if (type !== 'all') {
        query = query.eq('type', type)
      }

      // 如果是学习互助且选择了学科筛选
      if (type === 'study_help' && options?.subject) {
        query = query.eq('subject', options.subject)
      }

      const { data, error } = await query

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
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }

  const handleCreatePost = async (data: CreatePostDTO) => {
    if (!user) return

    // 每日发帖上限检查
    try {
      // 1. 获取发帖上限配置
      const { data: settings } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'daily_post_limit')
        .single()
      
      const dailyLimit = settings ? parseInt(settings.value) : 3
      
      // 2. 检查今日发帖次数 (使用 RPC 函数)
      const { data: canPost, error: limitError } = await supabase
        .rpc('check_daily_post_limit', {
          p_user_id: user.userId,
          p_limit: dailyLimit
        })

      if (limitError || !canPost) {
        // 获取当前已发帖数
        const { data: currentCount } = await supabase
          .rpc('get_daily_post_count', { p_user_id: user.userId })
        
        alert(`今日发帖已达上限 (${currentCount || dailyLimit}/${dailyLimit}条)，请明天再来分享吧！`)
        return
      }

      // 3. 创建帖子，关联 user_id
      const newPost = {
        content: data.content,
        author_name: data.author_name,
        type: data.type,
        subject: data.subject,
        image_url: data.image_url,
        avatar_url: user.avatar,
        user_id: user.userId, // 关联用户ID
        likes: 0,
        review_status: 'pending' as const,
        quoted_post_id: (data as any).quoted_post_id,
      }

      const { data: newPosts, error } = await supabase
        .from('posts')
        .insert([newPost])
        .select()

      if (error) {
        console.error('Error creating post:', error)
        alert('发布失败：' + error.message)
      } else {
        // 4. 增加今日发帖计数 (使用 RPC 函数)
        await supabase.rpc('increment_daily_post_count', {
          p_user_id: user.userId
        })
        
        // 5. 获取更新后的计数
        const { data: newCount } = await supabase
          .rpc('get_daily_post_count', { p_user_id: user.userId })
        
        alert(`发布成功！(今日已发 ${newCount || 1}/${dailyLimit})，已提交审核。`)
        fetchPosts(activeTab)
      }
    } catch (err) {
        console.error(err)
    }
  }

  const handleLike = async (postId: string) => {
    if (!isLoggedIn) {
      alert('请先登录后再点赞')
      return
    }

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

  const handleDelete = (postId: string) => {
    // 从列表中移除已删除的帖子
    setPosts(posts.filter(post => post.id !== postId))
  }

  const navItems = [
    { id: 'all', label: '首页' },
    { id: 'campus_fun', label: '校园趣事' },
    { id: 'study_help', label: '学习互助' },
    { id: 'confession', label: '表白墙' },
    { id: 'anonymous', label: '匿名树洞' },
  ]

  return (
    <main className="min-h-screen bg-[#121212] text-white">
      {/* 顶部导航模拟 */}
      <nav className="sticky top-0 z-10 bg-[#121212]/80 backdrop-blur border-b border-white/10 mb-6">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between">
          <div className="font-bold text-[#0066CC] text-base sm:text-lg">武冈三中论坛</div>
          
          {/* 桌面端导航 */}
          <div className="hidden md:flex gap-4 items-center text-sm text-gray-400">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={clsx(
                  "transition-colors font-medium",
                  activeTab === item.id ? "text-white" : "hover:text-white"
                )}
              >
                {item.label}
              </button>
            ))}
            <Link 
              href="/my-posts" 
              className="hover:text-white transition-colors font-medium ml-2"
            >
              我的
            </Link>
            <button
              onClick={() => setShowSuggestion(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-600/10 hover:bg-green-600/20 text-xs text-green-400 border border-green-500/30 ml-1"
            >
              <MessageSquarePlus size={14} />
              意见反馈
            </button>
            {isLoggedIn ? (
              <div className="flex items-center gap-2 ml-4">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.nickname}
                    className="w-7 h-7 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white/20">
                    {user?.nickname?.charAt(0)}
                  </div>
                )}
                <span className="text-gray-100 text-sm">{user?.nickname}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-4 text-xs">
                <Link href="/login" className="hover:text-white">
                  登录
                </Link>
                <Link href="/register" className="hover:text-white">
                  注册
                </Link>
              </div>
            )}
          </div>

          {/* 移动端导航 */}
          <div className="flex md:hidden items-center gap-2">
            {isLoggedIn ? (
              <Link href="/my-posts" className="p-2 hover:bg-white/10 rounded-lg">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.nickname}
                    className="w-7 h-7 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white/20">
                    {user?.nickname?.charAt(0)}
                  </div>
                )}
              </Link>
            ) : (
              <div className="flex gap-2 text-xs">
                <Link href="/login" className="text-gray-400 hover:text-white px-2 py-1">
                  登录
                </Link>
                <Link href="/register" className="text-gray-400 hover:text-white px-2 py-1">
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 移动端板块导航 */}
        <div className="md:hidden border-t border-white/10 px-3 py-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                  activeTab === item.id 
                    ? "bg-blue-600 text-white" 
                    : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* 左侧主要内容区 (占 2/3) */}
        <div className="md:col-span-2">
          <header className="mb-4 md:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold mb-1 text-white">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm">
              {activeTab === 'all' ? '看看同学们都在聊什么' : 
               activeTab === 'campus_fun' ? '分享校园里的快乐瞬间' :
               activeTab === 'study_help' ? '互帮互助，共同进步' :
               activeTab === 'confession' ? '大声说出你的爱与感谢' :
               '嘘...这里只有秘密'}
            </p>
          </header>

          {/* 学科筛选器（仅在学习互助板块显示） */}
          {activeTab === 'study_help' && (
            <div className="mb-4 md:mb-6 flex gap-2 flex-wrap overflow-x-auto pb-2">
              <button
                onClick={() => setSubjectFilter(null)}
                className={clsx(
                  "px-3 py-1.5 text-xs sm:text-sm rounded-full transition-colors whitespace-nowrap",
                  subjectFilter === null
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
                )}
              >
                全部学科
              </button>
              {['数学', '物理', '化学', '生物', '英语', '语文', '历史', '地理', '政治'].map(subject => (
                <button
                  key={subject}
                  onClick={() => setSubjectFilter(subject)}
                  className={clsx(
                    "px-3 py-1.5 text-xs sm:text-sm rounded-full transition-colors whitespace-nowrap",
                    subjectFilter === subject
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
                  )}
                >
                  {subject}
                </button>
              ))}
            </div>
          )}

          {isLoggedIn ? (
            <CreatePost onSubmit={handleCreatePost} currentType={activeTab === 'all' ? 'campus_fun' : activeTab as PostType} />
          ) : (
            <div className="mb-6 md:mb-8 bg-neutral-900 p-3 sm:p-4 rounded-lg border border-white/10">
              <div className="text-xs sm:text-sm text-gray-200 mb-3">登录后才能发帖和点赞。</div>
              <div className="flex gap-2 sm:gap-3">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded bg-[#0066CC] text-xs text-white hover:bg-[#1a7be0]"
                >
                  去登录
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-1.5 rounded border border-white/20 text-xs text-gray-200 hover:bg-white/10"
                >
                  去注册
                </Link>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="text-center text-gray-500 py-10">加载中...</div>
            ) : (
              <>
                {posts.length === 0 && (
                  <div className="text-center text-gray-500 py-10">暂时没有帖子，快来发布第一条吧！</div>
                )}
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
        </div>

        {/* 右侧侧边栏 (占 1/3) */}
        <div className="hidden md:block space-y-6">
          {/* 公告卡片 */}
          <div className="bg-neutral-900 border border-white/10 rounded-lg p-4">
             <h3 className="font-bold text-white mb-3">📢 校园公告</h3>
             {announcements.length === 0 ? (
               <p className="text-xs text-gray-500 text-center py-2">暂无公告</p>
             ) : (
               <ul className="space-y-2 text-sm text-gray-300">
                 {announcements.map(item => (
                   <li key={item.id} className="flex gap-2">
                     <span className={clsx(
                       "font-bold whitespace-nowrap",
                       item.is_top ? "text-red-400" : 
                       item.type === 'activity' ? "text-green-400" : 
                       item.type === 'urgent' ? "text-orange-400" : "text-blue-400"
                     )}>
                       {item.is_top ? '置顶' : 
                        item.type === 'activity' ? '活动' :
                        item.type === 'urgent' ? '紧急' : '通知'}
                     </span>
                     <span className="truncate">{item.title}</span>
                   </li>
                 ))}
               </ul>
             )}
          </div>

          {/* 排行榜组件 */}
          <Leaderboard />
          
          <div className="text-xs text-center text-gray-600 mt-8">
            武冈三中校园论坛 © 2025 <br/>
            Designed for Students
          </div>
        </div>
      </div>

      {/* 意见反馈对话框 */}
      {showSuggestion && (
        <SuggestionDialog
          onClose={() => setShowSuggestion(false)}
          onSuccess={() => {}}
        />
      )}

      {/* 申诉对话框 */}
      {showAppeal && selectedPost && (
        <AppealDialog
          post={selectedPost}
          onClose={() => {
            setShowAppeal(false)
            setSelectedPost(null)
          }}
          onSuccess={() => fetchPosts(activeTab)}
        />
      )}
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
