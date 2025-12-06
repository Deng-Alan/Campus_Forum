'use client'

import { useEffect, useState } from 'react'
import { PostCard } from '@/components/PostCard'
import { CreatePost } from '@/components/CreatePost'
import { Leaderboard } from '@/components/Leaderboard'
import { UserSettings } from '@/components/UserSettings'
import { AppealDialog } from '@/components/AppealDialog'
import { SuggestionDialog } from '@/components/SuggestionDialog'
import { apiGet, apiPost } from '@/lib/api'
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
      const data = await apiGet<{
        id: string
        title: string
        content: string
        type: 'notice' | 'activity' | 'urgent'
        isTop: boolean
        createdAt: string
      }[]>('/announcements', { limit: 5 })

      const mapped: Announcement[] = data.map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        type: item.type,
        is_top: item.isTop,
        created_at: item.createdAt,
      }))

      setAnnouncements(mapped)
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
      const data = await apiGet<{
        list: {
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
        }[]
        total: number
        page: number
        size: number
        pages: number
      }>('/posts', {
        page: 1,
        size: 50,
        type: type === 'all' ? undefined : type,
        subject: type === 'study_help' ? options?.subject || undefined : undefined,
      })

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
      setPosts(MOCK_POSTS)
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }

  const handleCreatePost = async (data: CreatePostDTO) => {
    if (!user) return

    try {
      const body = {
        content: data.content,
        type: data.type,
        subject: data.subject,
        imageUrl: data.image_url,
        quotedPostId: (data as any).quoted_post_id,
      }

      const result = await apiPost<{
        id: string
        dailyPostCount: number
        dailyPostLimit: number
      }>('/posts', body)

      alert(`发布成功！(今日已发 ${result.dailyPostCount}/${result.dailyPostLimit})，已提交审核。`)
      fetchPosts(activeTab)
    } catch (err: any) {
      console.error(err)
      alert(err?.message || '发布失败，请稍后重试')
    }
  }

  const handleLike = async (postId: string) => {
    if (!isLoggedIn) {
      alert('请先登录后再点赞')
      return
    }

    try {
      const data = await apiPost<{ likes: number }>(`/posts/${postId}/like`)
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, likes: data.likes } : post
      ))
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
              <Link
                href="/my-posts"
                className="flex items-center gap-2 ml-4 px-2 py-1 rounded-full hover:bg-white/10 transition-colors"
              >
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
              </Link>
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
