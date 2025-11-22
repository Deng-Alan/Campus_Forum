"use client"

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { supabase } from '@/lib/supabase'
import { Post, Announcement, Report } from '@/types'
import { Trash2, LogOut, Megaphone, FileText, AlertTriangle, Check, X, Plus, Settings, Menu, MessageSquare, TrendingUp } from 'lucide-react'
import clsx from 'clsx'

type Tab = 'dashboard' | 'posts' | 'announcements' | 'reports' | 'moderation' | 'comments' | 'settings'

interface Comment {
  id: string
  post_id: string
  author_name: string
  content: string
  created_at: string
  post_title?: string
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  // Data States
  const [posts, setPosts] = useState<Post[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [stats, setStats] = useState({
    totalPosts: 0,
    studyHelpPosts: 0,
    confessionPosts: 0,
    anonymousPosts: 0,
    announcements: 0,
    pendingReports: 0,
    totalComments: 0,
    totalUsers: 0,
  })
  const [chartData, setChartData] = useState<any[]>([])

  // Posts filters
  const [postSearch, setPostSearch] = useState('')
  const [postTypeFilter, setPostTypeFilter] = useState<'all' | 'campus_fun' | 'study_help' | 'confession' | 'anonymous'>('all')
  const [postReviewFilter, setPostReviewFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all')
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'ignored'>('all')

  // New Announcement State
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', type: 'notice', is_top: false })
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState<{
    title: string
    content: string
    type: 'notice' | 'activity' | 'urgent'
    is_top: boolean
  } | null>(null)
  const [moderationLoadingId, setModerationLoadingId] = useState<string | null>(null)
  const [reportActionLoadingId, setReportActionLoadingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  // Settings State
  const [systemSettings, setSystemSettings] = useState<{ daily_post_limit: string }>({ daily_post_limit: '3' })

  useEffect(() => {
    const token = Cookies.get('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }

    fetchData()

    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchData({ silent: true })
      }
    }, 30000) // 优化：从15秒改为30秒

    return () => {
      clearInterval(intervalId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, activeTab, postTypeFilter, postReviewFilter, postSearch])

  useEffect(() => {
    const token = Cookies.get('admin_token')
    if (!token) {
      return
    }

    fetchStats()

    const statsIntervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchStats()
      }
    }, 60000) // 优化：从30秒改为60秒

    return () => {
      clearInterval(statsIntervalId)
    }
  }, [router])

  const fetchData = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true)
    }
    try {
      if (activeTab === 'posts') {
        let query = supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })

        if (postTypeFilter !== 'all') {
          query = query.eq('type', postTypeFilter)
        }

        if (postReviewFilter !== 'all') {
          query = query.eq('review_status', postReviewFilter)
        }

        if (postSearch.trim()) {
          const keyword = postSearch.trim().replace(/%/g, '').replace(/,/g, '')
          const pattern = `%${keyword}%`
          query = query.or(`content.ilike.${pattern},author_name.ilike.${pattern}`)
        }

        const { data } = await query
        setPosts(data || [])
      } else if (activeTab === 'announcements') {
        const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
        setAnnouncements(data || [])
      } else if (activeTab === 'reports') {
        // 联表查询被举报的帖子信息
        const { data } = await supabase.from('reports').select('*, posts(*)').order('created_at', { ascending: false })
        setReports((data as any) || [])
      } else if (activeTab === 'moderation') {
        let query = supabase
          .from('posts')
          .select('*')
          .eq('review_status', 'pending')
          .order('created_at', { ascending: false })

        if (postTypeFilter !== 'all') {
          query = query.eq('type', postTypeFilter)
        }

        if (postSearch.trim()) {
          const keyword = postSearch.trim().replace(/%/g, '').replace(/,/g, '')
          const pattern = `%${keyword}%`
          query = query.or(`content.ilike.${pattern},author_name.ilike.${pattern}`)
        }

        const { data } = await query
        setPosts(data || [])
      } else if (activeTab === 'dashboard') {
        await fetchChartData()
      } else if (activeTab === 'comments') {
        await fetchComments()
      } else if (activeTab === 'settings') {
        const { data } = await supabase.from('system_settings').select('*')
        if (data && data.length > 0) {
          const settings: any = {}
          data.forEach(item => {
            settings[item.key] = item.value
          })
          setSystemSettings(settings)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }, [activeTab, postTypeFilter, postReviewFilter, postSearch])

  // 获取评论数据
  const fetchComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*, posts(content)')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (!error && data) {
      setComments(data.map(c => ({
        ...c,
        post_title: c.posts?.content?.substring(0, 30) + '...' || '已删除帖子'
      })))
    }
  }, [])

  // 删除评论
  const handleDeleteComment = useCallback(async (id: string) => {
    if (!confirm('确定要删除这条评论吗？')) return
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (!error) {
      setComments(comments.filter(c => c.id !== id))
      alert('删除成功')
    } else {
      alert('删除失败')
    }
  }, [comments])

  // 获取图表数据（最近7天）- 优化版：一次查询获取所有数据
  const fetchChartData = useCallback(async () => {
    const days = 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (days - 1))
    startDate.setHours(0, 0, 0, 0)
    
    // 一次性获取所有帖子和评论数据
    const [
      { data: posts },
      { data: comments }
    ] = await Promise.all([
      supabase
        .from('posts')
        .select('created_at')
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('comments')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
    ])
    
    // 在前端按日期分组统计
    const data = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)
      
      const postsCount = posts?.filter(p => {
        const createdAt = new Date(p.created_at)
        return createdAt >= date && createdAt < nextDate
      }).length || 0
      
      const commentsCount = comments?.filter(c => {
        const createdAt = new Date(c.created_at)
        return createdAt >= date && createdAt < nextDate
      }).length || 0
      
      data.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        posts: postsCount,
        comments: commentsCount,
      })
    }
    
    setChartData(data)
  }, [])

  const fetchStats = async () => {
    try {
      const [
        { count: totalPosts },
        { count: studyHelpPosts },
        { count: confessionPosts },
        { count: anonymousPosts },
        { count: announcementsCount },
        { count: pendingReports },
      ] = await Promise.all([
        supabase.from('posts').select('*', { head: true, count: 'exact' }),
        supabase.from('posts').select('*', { head: true, count: 'exact' }).eq('type', 'study_help'),
        supabase.from('posts').select('*', { head: true, count: 'exact' }).eq('type', 'confession'),
        supabase.from('posts').select('*', { head: true, count: 'exact' }).eq('type', 'anonymous'),
        supabase.from('announcements').select('*', { head: true, count: 'exact' }),
        supabase.from('reports').select('*', { head: true, count: 'exact' }).eq('status', 'pending'),
      ])

      // 获取评论总数
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { head: true, count: 'exact' })
      
      // 获取用户总数 (从 user_profiles 表)
      const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { head: true, count: 'exact' })

      setStats({
        totalPosts: totalPosts || 0,
        studyHelpPosts: studyHelpPosts || 0,
        confessionPosts: confessionPosts || 0,
        anonymousPosts: anonymousPosts || 0,
        announcements: announcementsCount || 0,
        pendingReports: pendingReports || 0,
        totalComments: commentsCount || 0,
        totalUsers: usersCount || 0,
      })
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    }
  }

  // --- Post Actions ---
  const handleDeletePost = async (id: string) => {
    if (!confirm('确定要删除这条帖子吗？此操作不可恢复。')) return
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (!error) setPosts(posts.filter((p) => p.id !== id))
  }

  const handleToggleFeature = async (post: Post) => {
    const { error } = await supabase.from('posts').update({ is_featured: !post.is_featured }).eq('id', post.id)
    if (!error) setPosts(posts.map((p) => (p.id === post.id ? { ...p, is_featured: !p.is_featured } : p)))
  }

  // --- Moderation Actions ---
  const handleModeration = async (postId: string, status: 'approved' | 'rejected') => {
    const label = status === 'approved' ? '通过' : '驳回'
    if (!confirm(`确定要${label}这条帖子吗？`)) return

    setModerationLoadingId(postId)

    const { error } = await supabase.from('posts').update({ review_status: status }).eq('id', postId)

    if (error) {
      alert(label + '失败：' + error.message)
      setModerationLoadingId(null)
      return
    }

    setPosts(posts.filter((p) => p.id !== postId))
    setActionMessage(`已${label}该帖子`)
    setTimeout(() => setActionMessage(null), 2000)
    setModerationLoadingId(null)
  }

  // --- Announcement Actions ---
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('announcements').insert([newAnnouncement])
    if (!error) {
      setShowAnnouncementForm(false)
      setNewAnnouncement({ title: '', content: '', type: 'notice', is_top: false })
      fetchData()
    } else {
      alert('发布失败: ' + error.message)
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('确定删除此公告？')) return
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (!error) setAnnouncements(announcements.filter((a) => a.id !== id))
  }

  const startEditAnnouncement = (item: Announcement) => {
    setEditingAnnouncementId(item.id)
    setEditingAnnouncement({
      title: item.title,
      content: item.content || '',
      type: item.type,
      is_top: item.is_top,
    })
  }

  const cancelEditAnnouncement = () => {
    setEditingAnnouncementId(null)
    setEditingAnnouncement(null)
  }

  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncementId || !editingAnnouncement) return

    const { error } = await supabase
      .from('announcements')
      .update({
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        type: editingAnnouncement.type,
        is_top: editingAnnouncement.is_top,
      })
      .eq('id', editingAnnouncementId)

    if (error) {
      alert('更新失败: ' + error.message)
      return
    }

    setAnnouncements(
      announcements.map((item) => (item.id === editingAnnouncementId ? { ...item, ...editingAnnouncement } : item)),
    )

    setEditingAnnouncementId(null)
    setEditingAnnouncement(null)
  }

  const handleToggleAnnouncementTop = async (item: Announcement) => {
    const { error } = await supabase.from('announcements').update({ is_top: !item.is_top }).eq('id', item.id)

    if (error) {
      alert('更新置顶状态失败: ' + error.message)
      return
    }

    setAnnouncements(announcements.map((a) => (a.id === item.id ? { ...a, is_top: !item.is_top } : a)))
  }

  // --- Settings Actions ---
  const handleUpdateSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key, value })
      
    if (error) {
      alert('保存设置失败: ' + error.message)
    } else {
      setSystemSettings(prev => ({ ...prev, [key]: value }))
      setActionMessage('设置已保存')
      setTimeout(() => setActionMessage(null), 2000)
    }
  }

  // --- Report Actions ---
  const handleResolveReport = async (id: string, status: 'resolved' | 'ignored') => {
    const { error } = await supabase.from('reports').update({ status }).eq('id', id)
    if (!error) {
      setReports(reports.map((r) => (r.id === id ? { ...r, status } : r)))
      setActionMessage(status === 'resolved' ? '已标记为已处理' : '已忽略该举报')
      setTimeout(() => setActionMessage(null), 2000)
    }
  }

  // 删除被举报的帖子
  const handleDeleteReportedPost = async (reportId: string, postId: string) => {
    if (!confirm('确定删除该帖子并标记举报为已处理？')) return
    reportActionLoadingId || setReportActionLoadingId(reportId)

    const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId)
    if (deleteError) {
      alert('删除帖子失败')
      setReportActionLoadingId(null)
      return
    }

    await handleResolveReport(reportId, 'resolved')
    setActionMessage('已删除帖子并结案')
    setTimeout(() => setActionMessage(null), 2000)
    setReportActionLoadingId(null)
  }

  const handleLogout = () => {
    Cookies.remove('admin_token')
    router.push('/admin/login')
  }

  const filteredReports = useMemo(() => 
    reportStatusFilter === 'all' ? reports : reports.filter((r) => r.status === reportStatusFilter),
    [reports, reportStatusFilter]
  )

  const reportStats = useMemo(() => ({
    total: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    ignored: reports.filter((r) => r.status === 'ignored').length,
  }), [reports])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row">
      {/* 移动端顶部栏 */}
      <div className="md:hidden bg-neutral-900 border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <h1 className="text-lg font-bold text-[#0066CC]">三中论坛后台</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* 遮罩层 (移动端) */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        "bg-neutral-900 border-r border-white/10 p-4 sm:p-6 flex flex-col",
        "md:w-64 md:static md:translate-x-0",
        "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <h1 className="text-lg sm:text-xl font-bold text-[#0066CC] mb-6 sm:mb-8 hidden md:block">三中论坛后台</h1>

        <nav className="space-y-2 flex-1">
          <button
            onClick={() => {
              setActiveTab('dashboard')
              setSidebarOpen(false)
            }}
            className={clsx(
              'w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded transition-colors text-sm sm:text-base',
              activeTab === 'dashboard'
                ? 'bg-[#0066CC] text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white',
            )}
          >
            <TrendingUp size={18} /> 数据统计
          </button>
          <button
            onClick={() => {
              setActiveTab('posts')
              setSidebarOpen(false)
            }}
            className={clsx(
              'w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded transition-colors text-sm sm:text-base',
              activeTab === 'posts'
                ? 'bg-[#0066CC] text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white',
            )}
          >
            <FileText size={18} /> 帖子管理
          </button>
          <button
            onClick={() => {
              setActiveTab('announcements')
              setSidebarOpen(false)
            }}
            className={clsx(
              'w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded transition-colors text-sm sm:text-base',
              activeTab === 'announcements'
                ? 'bg-[#0066CC] text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white',
            )}
          >
            <Megaphone size={18} /> 公告管理
          </button>
          <button
            onClick={() => {
              setActiveTab('reports')
              setSidebarOpen(false)
            }}
            className={clsx(
              'w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded transition-colors text-sm sm:text-base',
              activeTab === 'reports'
                ? 'bg-[#0066CC] text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white',
            )}
          >
            <AlertTriangle size={18} /> 举报处理
          </button>
          <button
            onClick={() => {
              setActiveTab('moderation')
              setSidebarOpen(false)
            }}
            className={clsx(
              'w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded transition-colors text-sm sm:text-base',
              activeTab === 'moderation'
                ? 'bg-[#0066CC] text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white',
            )}
          >
            <Check size={18} /> 审核管理
          </button>
          <button
            onClick={() => {
              setActiveTab('comments')
              setSidebarOpen(false)
            }}
            className={clsx(
              'w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded transition-colors text-sm sm:text-base',
              activeTab === 'comments'
                ? 'bg-[#0066CC] text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white',
            )}
          >
            <MessageSquare size={18} /> 评论管理
          </button>
          <button
            onClick={() => {
              setActiveTab('settings')
              setSidebarOpen(false)
            }}
            className={clsx(
              'w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded transition-colors text-sm sm:text-base',
              activeTab === 'settings'
                ? 'bg-[#0066CC] text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white',
            )}
          >
            <Settings size={18} /> 系统设置
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-500 hover:text-red-400 px-4 py-2 mt-auto"
        >
          <LogOut size={18} /> 退出登录
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto min-h-screen md:h-screen">
        {loading ? (
          <div className="text-center text-gray-500 mt-20">加载中...</div>
        ) : (
          <>
            {/* 概览统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
                <div className="text-xs text-gray-400 mb-1">总帖子数</div>
                <div className="text-2xl font-bold text-white">{stats.totalPosts}</div>
                <div className="text-xs text-gray-500 mt-1">所有板块累计帖子</div>
              </div>
              <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
                <div className="text-xs text-gray-400 mb-1">学习互助帖子</div>
                <div className="text-2xl font-bold text-blue-400">{stats.studyHelpPosts}</div>
                <div className="text-xs text-gray-500 mt-1">用于学霸排行榜统计</div>
              </div>
              <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
                <div className="text-xs text-gray-400 mb-1">公告数量</div>
                <div className="text-2xl font-bold text-green-400">{stats.announcements}</div>
                <div className="text-xs text-gray-500 mt-1">首页右侧展示公告</div>
              </div>
              <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
                <div className="text-xs text-gray-400 mb-1">待处理举报</div>
                <div
                  className={clsx(
                    'text-2xl font-bold',
                    stats.pendingReports > 0 ? 'text-red-400' : 'text-gray-400',
                  )}
                >
                  {stats.pendingReports}
                </div>
                <div className="text-xs text-gray-500 mt-1">请及时处理违规内容</div>
              </div>
            </div>

            {actionMessage && (
              <div className="fixed top-4 right-4 z-50">
                <div className="px-4 py-2 rounded-md border border-green-500 bg-black text-xs text-green-300 shadow-lg shadow-black/40">
                  {actionMessage}
                </div>
              </div>
            )}

            {/* Dashboard - 数据统计 */}
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6">数据统计</h2>

                {/* 折线图数据展示 */}
                <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4 sm:p-6 mb-6">
                  <h3 className="text-lg font-bold mb-4">近7天趋势</h3>
                  {chartData.length > 0 ? (() => {
                      const maxValue = Math.max(
                        1, // 最小值为1，避免除以0
                        ...chartData.map(d => Math.max(d.posts, d.comments))
                      )
                      
                      // 如果所有数据都是0，显示提示
                      if (maxValue <= 1 && chartData.every(d => d.posts === 0 && d.comments === 0)) {
                        return (
                          <div className="text-center text-gray-500 py-8">
                            暂无数据，请先发布帖子或评论
                          </div>
                        )
                      }
                      
                      return (
                        <div className="space-y-4">
                          {/* SVG 折线图 */}
                          <div className="w-full overflow-x-auto">
                            <svg
                              viewBox="0 0 700 300"
                              className="w-full h-auto"
                              style={{ minWidth: '500px' }}
                            >
                              {/* 网格线 */}
                              {[0, 1, 2, 3, 4, 5].map((i) => (
                                <g key={i}>
                                  <line
                                    x1="50"
                                    y1={50 + i * 40}
                                    x2="650"
                                    y2={50 + i * 40}
                                    stroke="#374151"
                                    strokeWidth="1"
                                    strokeDasharray="5,5"
                                  />
                                </g>
                              ))}

                              {/* Y轴标签 */}
                              {[0, 1, 2, 3, 4, 5].map((i) => {
                                const value = Math.ceil(maxValue - (maxValue / 5) * i)
                                return (
                                  <text
                                    key={i}
                                    x="40"
                                    y={55 + i * 40}
                                    fill="#9CA3AF"
                                    fontSize="12"
                                    textAnchor="end"
                                  >
                                    {value}
                                  </text>
                                )
                              })}

                          {/* X轴标签 */}
                          {chartData.map((item, idx) => (
                            <text
                              key={idx}
                              x={50 + (idx * (600 / (chartData.length - 1)))}
                              y="270"
                              fill="#9CA3AF"
                              fontSize="12"
                              textAnchor="middle"
                            >
                              {item.date}
                            </text>
                          ))}

                              {/* 帖子数据线（蓝色） */}
                              <polyline
                                points={chartData
                                  .map((item, idx) => {
                                    const x = 50 + (idx * (600 / (chartData.length - 1)))
                                    const y = 250 - (item.posts / maxValue) * 200
                                    return `${x},${y}`
                                  })
                                  .join(' ')}
                                fill="none"
                                stroke="#3B82F6"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />

                              {/* 帖子数据点 */}
                              {chartData.map((item, idx) => {
                                const x = 50 + (idx * (600 / (chartData.length - 1)))
                                const y = 250 - (item.posts / maxValue) * 200
                                return (
                                  <g key={idx}>
                                    <circle cx={x} cy={y} r="5" fill="#3B82F6" />
                                    <text
                                      x={x}
                                      y={y - 10}
                                      fill="#3B82F6"
                                      fontSize="11"
                                      fontWeight="bold"
                                      textAnchor="middle"
                                    >
                                      {item.posts}
                                    </text>
                                  </g>
                                )
                              })}

                              {/* 评论数据线（绿色） */}
                              <polyline
                                points={chartData
                                  .map((item, idx) => {
                                    const x = 50 + (idx * (600 / (chartData.length - 1)))
                                    const y = 250 - (item.comments / maxValue) * 200
                                    return `${x},${y}`
                                  })
                                  .join(' ')}
                                fill="none"
                                stroke="#10B981"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />

                              {/* 评论数据点 */}
                              {chartData.map((item, idx) => {
                                const x = 50 + (idx * (600 / (chartData.length - 1)))
                                const y = 250 - (item.comments / maxValue) * 200
                                return (
                                  <g key={idx}>
                                    <circle cx={x} cy={y} r="5" fill="#10B981" />
                                    <text
                                      x={x}
                                      y={y - 10}
                                      fill="#10B981"
                                      fontSize="11"
                                      fontWeight="bold"
                                      textAnchor="middle"
                                    >
                                      {item.comments}
                                    </text>
                                  </g>
                                )
                              })}
                            </svg>
                          </div>

                          {/* 图例 */}
                          <div className="flex gap-6 text-sm justify-center">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                              <span>帖子</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                              <span>评论</span>
                            </div>
                          </div>
                        </div>
                      )
                    })() : (
                      <div className="text-center text-gray-500 py-8">正在加载数据...</div>
                    )}
                  </div>

                {/* 用户统计 */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
                    <div className="text-xs text-gray-400 mb-1">注册用户</div>
                    <div className="text-3xl font-bold text-purple-400">{stats.totalUsers}</div>
                  </div>
                  <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
                    <div className="text-xs text-gray-400 mb-1">总评论数</div>
                    <div className="text-3xl font-bold text-green-400">{stats.totalComments}</div>
                  </div>
                  <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
                    <div className="text-xs text-gray-400 mb-1">总帖子数</div>
                    <div className="text-3xl font-bold text-blue-400">{stats.totalPosts}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Comments Management - 评论管理 */}
            {activeTab === 'comments' && (
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6">评论管理</h2>
                
                <div className="bg-neutral-900 rounded-lg border border-neutral-800">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-neutral-800 border-b border-neutral-700">
                        <tr>
                          <th className="text-left p-3 sm:p-4 font-medium text-gray-400">评论内容</th>
                          <th className="text-left p-3 sm:p-4 font-medium text-gray-400 hidden sm:table-cell">作者</th>
                          <th className="text-left p-3 sm:p-4 font-medium text-gray-400 hidden md:table-cell">所属帖子</th>
                          <th className="text-left p-3 sm:p-4 font-medium text-gray-400 hidden lg:table-cell">时间</th>
                          <th className="text-right p-3 sm:p-4 font-medium text-gray-400">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center text-gray-500 py-8">暂无评论</td>
                          </tr>
                        ) : (
                          comments.map((comment) => (
                            <tr key={comment.id} className="border-b border-neutral-800 hover:bg-neutral-800/50">
                              <td className="p-3 sm:p-4">
                                <div className="max-w-md truncate">{comment.content}</div>
                                <div className="text-xs text-gray-500 mt-1 sm:hidden">
                                  {comment.author_name} · {new Date(comment.created_at).toLocaleDateString()}
                                </div>
                              </td>
                              <td className="p-3 sm:p-4 hidden sm:table-cell">{comment.author_name}</td>
                              <td className="p-3 sm:p-4 hidden md:table-cell">
                                <div className="max-w-xs truncate text-gray-400">{comment.post_title}</div>
                              </td>
                              <td className="p-3 sm:p-4 text-gray-400 hidden lg:table-cell">
                                {new Date(comment.created_at).toLocaleString()}
                              </td>
                              <td className="p-3 sm:p-4 text-right">
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded transition-colors"
                                  title="删除评论"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Posts Management */}
            {activeTab === 'posts' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">帖子管理</h2>

                {/* 搜索与筛选条 */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      placeholder="按内容或作者搜索..."
                      className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder:text-gray-500 w-64"
                      value={postSearch}
                      onChange={(e) => setPostSearch(e.target.value)}
                    />
                    <select
                      className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white"
                      value={postTypeFilter}
                      onChange={(e) => setPostTypeFilter(e.target.value as any)}
                    >
                      <option value="all">所有类型</option>
                      <option value="campus_fun">校园趣事</option>
                      <option value="study_help">学习互助</option>
                      <option value="confession">表白墙</option>
                      <option value="anonymous">匿名树洞</option>
                    </select>
                    <select
                      className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white"
                      value={postReviewFilter}
                      onChange={(e) => setPostReviewFilter(e.target.value as any)}
                    >
                      <option value="all">全部审核状态</option>
                      <option value="approved">已通过</option>
                      <option value="pending">待审核</option>
                      <option value="rejected">已驳回</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setPostSearch('')
                      setPostTypeFilter('all')
                      setPostReviewFilter('all')
                    }}
                    className="px-3 py-2 text-xs border border-neutral-700 rounded text-gray-300 hover:bg-neutral-800"
                  >
                    清空筛选
                  </button>
                </div>

                <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-800 text-neutral-400">
                      <tr>
                        <th className="p-4">类型</th>
                        <th className="p-4">内容</th>
                        <th className="p-4">作者</th>
                        <th className="p-4">发布时间</th>
                        <th className="p-4 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {posts.map((post) => (
                        <tr key={post.id} className="hover:bg-neutral-800/50">
                          <td className="p-4">
                            <span className="text-xs border border-gray-600 px-2 py-1 rounded text-gray-400">
                              {post.type}
                            </span>
                          </td>
                          <td className="p-4 max-w-md truncate" title={post.content}>
                            {post.content}
                          </td>
                          <td className="p-4 text-gray-300">{post.author_name}</td>
                          <td className="p-4 text-gray-500">
                            {new Date(post.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => handleToggleFeature(post)}
                              className={clsx(
                                'p-2 rounded',
                                post.is_featured
                                  ? 'text-yellow-500'
                                  : 'text-gray-600 hover:text-yellow-500',
                              )}
                            >
                              ⭐
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-2 text-red-500 hover:bg-red-900/20 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Announcements Management */}
            {activeTab === 'announcements' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">公告管理</h2>
                  <button
                    onClick={() => setShowAnnouncementForm(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <Plus size={18} /> 发布公告
                  </button>
                </div>

                {showAnnouncementForm && (
                  <form
                    onSubmit={handleCreateAnnouncement}
                    className="bg-neutral-800 p-6 rounded-lg mb-8 border border-neutral-700"
                  >
                    <div className="grid gap-4">
                      <input
                        type="text"
                        placeholder="公告标题"
                        className="bg-neutral-900 border border-neutral-700 p-2 rounded text-white"
                        value={newAnnouncement.title}
                        onChange={(e) =>
                          setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                        }
                        required
                      />
                      <textarea
                        placeholder="公告内容"
                        className="bg-neutral-900 border border-neutral-700 p-2 rounded text-white h-24"
                        value={newAnnouncement.content}
                        onChange={(e) =>
                          setNewAnnouncement({ ...newAnnouncement, content: e.target.value })
                        }
                      />
                      <div className="flex gap-4">
                        <select
                          className="bg-neutral-900 border border-neutral-700 p-2 rounded text-white"
                          value={newAnnouncement.type}
                          onChange={(e) =>
                            setNewAnnouncement({
                              ...newAnnouncement,
                              type: e.target.value as any,
                            })
                          }
                        >
                          <option value="notice">普通通知</option>
                          <option value="activity">校园活动</option>
                          <option value="urgent">紧急通知</option>
                        </select>
                        <label className="flex items-center gap-2 text-gray-300">
                          <input
                            type="checkbox"
                            checked={newAnnouncement.is_top}
                            onChange={(e) =>
                              setNewAnnouncement({
                                ...newAnnouncement,
                                is_top: e.target.checked,
                              })
                            }
                          />{' '}
                          置顶显示
                        </label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAnnouncementForm(false)}
                          className="px-4 py-2 text-gray-400 hover:text-white"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                        >
                          发布
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="bg-neutral-900 rounded-lg border border-neutral-800">
                  {announcements.map((item) => {
                    const isEditing = editingAnnouncementId === item.id
                    const draft = editingAnnouncement

                    return (
                      <div
                        key={item.id}
                        className="p-4 border-b border-neutral-800 flex justify-between items-start gap-4 last:border-0"
                      >
                        <div className="flex-1">
                          {isEditing ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                {draft?.is_top && (
                                  <span className="text-red-400 text-xs border border-red-400 px-1 rounded">
                                    置顶
                                  </span>
                                )}
                                <select
                                  className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white"
                                  value={draft?.type || item.type}
                                  onChange={(e) =>
                                    setEditingAnnouncement((prev) =>
                                      prev
                                        ? { ...prev, type: e.target.value as any }
                                        : prev,
                                    )
                                  }
                                >
                                  <option value="notice">通知</option>
                                  <option value="activity">活动</option>
                                  <option value="urgent">紧急</option>
                                </select>
                                <label className="flex items-center gap-1 text-xs text-gray-300">
                                  <input
                                    type="checkbox"
                                    checked={draft?.is_top ?? item.is_top}
                                    onChange={(e) =>
                                      setEditingAnnouncement((prev) =>
                                        prev
                                          ? { ...prev, is_top: e.target.checked }
                                          : prev,
                                      )
                                    }
                                  />
                                  置顶
                                </label>
                              </div>
                              <input
                                type="text"
                                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm text-white"
                                value={draft?.title ?? item.title}
                                onChange={(e) =>
                                  setEditingAnnouncement((prev) =>
                                    prev ? { ...prev, title: e.target.value } : prev,
                                  )
                                }
                              />
                              <textarea
                                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm text-white h-20"
                                value={(draft?.content ?? item.content) || ''}
                                onChange={(e) =>
                                  setEditingAnnouncement((prev) =>
                                    prev ? { ...prev, content: e.target.value } : prev,
                                  )
                                }
                              />
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 mb-1">
                                {item.is_top && (
                                  <span className="text-red-400 text-xs border border-red-400 px-1 rounded">
                                    置顶
                                  </span>
                                )}
                                <span
                                  className={clsx(
                                    'text-xs px-2 py-0.5 rounded-full',
                                    item.type === 'urgent'
                                      ? 'bg-orange-900 text-orange-400'
                                      : item.type === 'activity'
                                      ? 'bg-green-900 text-green-400'
                                      : 'bg-blue-900 text-blue-400',
                                  )}
                                >
                                  {item.type === 'urgent'
                                    ? '紧急'
                                    : item.type === 'activity'
                                    ? '活动'
                                    : '通知'}
                                </span>
                                <h3 className="font-bold">{item.title}</h3>
                              </div>
                              <p className="text-gray-400 text-sm">{item.content}</p>
                            </>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 text-xs">
                          {!isEditing && (
                            <>
                              <button
                                onClick={() => handleToggleAnnouncementTop(item)}
                                className="px-3 py-1 rounded border border-neutral-700 text-gray-200 hover:bg-neutral-800"
                              >
                                {item.is_top ? '取消置顶' : '设为置顶'}
                              </button>
                              <button
                                onClick={() => startEditAnnouncement(item)}
                                className="px-3 py-1 rounded border border-blue-600 text-blue-400 hover:bg-blue-900/30"
                              >
                                编辑
                              </button>
                            </>
                          )}
                          {isEditing && (
                            <div className="flex gap-2">
                              <button
                                onClick={cancelEditAnnouncement}
                                className="px-3 py-1 rounded border border-neutral-700 text-gray-300 hover:bg-neutral-800"
                              >
                                取消
                              </button>
                              <button
                                onClick={handleUpdateAnnouncement}
                                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                              >
                                保存
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => handleDeleteAnnouncement(item.id)}
                            className="px-3 py-1 rounded text-red-500 hover:bg-red-900/20 flex items-center gap-1"
                          >
                            <Trash2 size={14} /> 删除
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Reports Management */}
            {activeTab === 'reports' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">举报处理</h2>

                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs text-gray-300">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>全部 {reportStats.total}</span>
                    <span>· 待处理 {reportStats.pending}</span>
                    <span>· 已处理 {reportStats.resolved}</span>
                    <span>· 已忽略 {reportStats.ignored}</span>
                  </div>
                  <select
                    className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                    value={reportStatusFilter}
                    onChange={(e) => setReportStatusFilter(e.target.value as any)}
                  >
                    <option value="all">所有状态</option>
                    <option value="pending">只看待处理</option>
                    <option value="resolved">只看已处理</option>
                    <option value="ignored">只看已忽略</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={clsx(
                              'px-2 py-1 rounded text-xs font-bold',
                              report.status === 'pending'
                                ? 'bg-yellow-900 text-yellow-500'
                                : report.status === 'resolved'
                                ? 'bg-green-900 text-green-500'
                                : 'bg-gray-800 text-gray-500',
                            )}
                          >
                            {report.status === 'pending'
                              ? '待处理'
                              : report.status === 'resolved'
                              ? '已处理'
                              : '已忽略'}
                          </span>
                          <span className="text-gray-400 text-sm">举报理由：</span>
                          <span className="text-white font-bold">{report.reason}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(report.created_at).toLocaleString()}
                        </div>
                      </div>

                      {/* Post Preview */}
                      {report.posts ? (
                        <div className="bg-black/30 p-3 rounded border border-white/5 mb-4">
                          <div className="text-xs text-gray-500 mb-1">
                            被举报帖子 - {report.posts.author_name}:
                          </div>
                          <p className="text-gray-300 text-sm">{report.posts.content}</p>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic mb-4">（原贴已被删除）</div>
                      )}

                      {report.status === 'pending' && report.posts && (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={async () => {
                              if (reportActionLoadingId) return
                              setReportActionLoadingId(report.id)
                              await handleResolveReport(report.id, 'ignored')
                              setReportActionLoadingId(null)
                            }}
                            disabled={reportActionLoadingId === report.id}
                            className={clsx(
                              'px-3 py-1.5 text-gray-400 text-sm border border-gray-700 rounded hover:bg-gray-800 hover:text-white',
                              reportActionLoadingId === report.id && 'opacity-60 cursor-not-allowed',
                            )}
                          >
                            {reportActionLoadingId === report.id ? '处理中...' : '忽略举报'}
                          </button>
                          <button
                            onClick={() => handleDeleteReportedPost(report.id, report.post_id)}
                            disabled={reportActionLoadingId === report.id}
                            className={clsx(
                              'px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-500 flex items-center gap-1',
                              reportActionLoadingId === report.id && 'opacity-60 cursor-not-allowed',
                            )}
                          >
                            {reportActionLoadingId === report.id ? (
                              '处理中...'
                            ) : (
                              <>
                                <Trash2 size={14} /> 删除帖子并结案
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredReports.length === 0 && (
                    <div className="text-center text-gray-500 py-10">暂无举报记录</div>
                  )}
                </div>
              </div>
            )}

            {/* Moderation Management */}
            {activeTab === 'moderation' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">审核管理</h2>
                <p className="text-sm text-gray-400 mb-4">
                  这里显示所有<span className="text-yellow-400 font-medium">等待审核</span>的帖子，管理员可以选择通过、驳回或直接删除。
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      placeholder="按内容或作者搜索..."
                      className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder:text-gray-500 w-64"
                      value={postSearch}
                      onChange={(e) => setPostSearch(e.target.value)}
                    />
                    <select
                      className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white"
                      value={postTypeFilter}
                      onChange={(e) => setPostTypeFilter(e.target.value as any)}
                    >
                      <option value="all">所有类型</option>
                      <option value="campus_fun">校园趣事</option>
                      <option value="study_help">学习互助</option>
                      <option value="confession">表白墙</option>
                      <option value="anonymous">匿名树洞</option>
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      setPostSearch('')
                      setPostTypeFilter('all')
                    }}
                    className="px-3 py-2 text-xs border border-neutral-700 rounded text-gray-300 hover:bg-neutral-800"
                  >
                    清空筛选
                  </button>
                </div>
                <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-neutral-800 text-neutral-400">
                      <tr>
                        <th className="p-4">类型</th>
                        <th className="p-4">内容</th>
                        <th className="p-4">作者</th>
                        <th className="p-4">发布时间</th>
                        <th className="p-4 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800">
                      {posts.filter((post) => post.review_status === 'pending').map((post) => (
                        <tr key={post.id} className="hover:bg-neutral-800/50">
                          <td className="p-4">
                            <span className="text-xs border border-gray-600 px-2 py-1 rounded text-gray-400">
                              {post.type}
                            </span>
                          </td>
                          <td className="p-4 max-w-md truncate" title={post.content}>
                            {post.content}
                          </td>
                          <td className="p-4 text-gray-300">{post.author_name}</td>
                          <td className="p-4 text-gray-500">
                            {new Date(post.created_at).toLocaleString()}
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => handleModeration(post.id, 'approved')}
                              disabled={moderationLoadingId === post.id}
                              className={clsx(
                                'px-3 py-1.5 bg-green-600 text-white text-xs rounded flex items-center gap-1',
                                moderationLoadingId === post.id && 'opacity-60 cursor-not-allowed',
                              )}
                            >
                              {moderationLoadingId === post.id ? (
                                '处理中...'
                              ) : (
                                <>
                                  <Check size={14} /> 通过
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleModeration(post.id, 'rejected')}
                              disabled={moderationLoadingId === post.id}
                              className={clsx(
                                'px-3 py-1.5 bg-yellow-600 text-black text-xs rounded flex items-center gap-1',
                                moderationLoadingId === post.id && 'opacity-60 cursor-not-allowed',
                              )}
                            >
                              {moderationLoadingId === post.id ? (
                                '处理中...'
                              ) : (
                                <>
                                  <X size={14} /> 驳回
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-500 flex items-center gap-1"
                            >
                              <Trash2 size={14} /> 删除
                            </button>
                          </td>
                        </tr>
                      ))}
                      {posts.filter((post) => post.review_status === 'pending').length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">
                            当前没有待审核的帖子
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settings Management */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">系统设置</h2>
                <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-6 max-w-xl">
                  <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-2">
                      每日发帖上限 (次/账号)
                    </label>
                    <div className="flex gap-4">
                      <input 
                        type="number" 
                        min="1"
                        className="bg-black border border-neutral-700 rounded px-3 py-2 text-white w-32"
                        value={systemSettings.daily_post_limit}
                        onChange={(e) => setSystemSettings({...systemSettings, daily_post_limit: e.target.value})}
                      />
                      <button 
                        onClick={() => handleUpdateSetting('daily_post_limit', systemSettings.daily_post_limit)}
                        className="bg-[#0066CC] hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                      >
                        保存设置
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      限制每个账号每天可以发布的帖子数量，防止刷屏。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

