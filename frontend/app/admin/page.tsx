"use client"

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { Post, Announcement, Report, Appeal, Suggestion } from '@/types'
import { Trash2, LogOut, Megaphone, FileText, AlertTriangle, Check, X, Plus, Settings, Menu, MessageSquare, TrendingUp } from 'lucide-react'
import clsx from 'clsx'

type Tab =
  | 'dashboard'
  | 'posts'
  | 'announcements'
  | 'reports'
  | 'appeals'
  | 'suggestions'
  | 'moderation'
  | 'comments'
  | 'settings'

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
  const [appeals, setAppeals] = useState<Appeal[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
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

  // Filters
  const [postSearch, setPostSearch] = useState('')
  const [postTypeFilter, setPostTypeFilter] = useState<'all' | 'campus_fun' | 'study_help' | 'confession' | 'anonymous'>('all')
  const [postReviewFilter, setPostReviewFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all')
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'ignored'>('all')
  const [appealStatusFilter, setAppealStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [suggestionCategoryFilter, setSuggestionCategoryFilter] = useState<'all' | 'general' | 'feature' | 'bug' | 'improvement'>('all')
  const [suggestionStatusFilter, setSuggestionStatusFilter] = useState<'all' | 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'implemented'>('all')

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
  const [appealActionLoadingId, setAppealActionLoadingId] = useState<string | null>(null)
  const [suggestionActionLoadingId, setSuggestionActionLoadingId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)

  const [appealDialogOpen, setAppealDialogOpen] = useState(false)
  const [appealDialogTarget, setAppealDialogTarget] = useState<Appeal | null>(null)
  const [appealDialogAction, setAppealDialogAction] = useState<'approved' | 'rejected' | null>(null)
  const [appealDialogResponse, setAppealDialogResponse] = useState('')

  const [suggestionDialogOpen, setSuggestionDialogOpen] = useState(false)
  const [suggestionDialogTarget, setSuggestionDialogTarget] = useState<Suggestion | null>(null)
  const [suggestionDialogNextStatus, setSuggestionDialogNextStatus] = useState<
    'pending' | 'reviewing' | 'accepted' | 'rejected' | 'implemented' | null
  >(null)
  const [suggestionDialogResponse, setSuggestionDialogResponse] = useState('')

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
  }, [router, activeTab, postTypeFilter, postReviewFilter, postSearch, appealStatusFilter, suggestionCategoryFilter, suggestionStatusFilter])

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
        const data = await apiGet<{
          list: {
            id: string
            content: string
            authorName: string
            type: string
            subject?: string
            imageUrl?: string
            likes: number
            commentCount: number
            isFeatured: boolean
            reviewStatus: string
            status: string
            createdAt: string
          }[]
          total: number
          page: number
          size: number
        }>('/admin/posts', {
          page: 1,
          size: 100,
          type: postTypeFilter === 'all' ? undefined : postTypeFilter,
          reviewStatus: postReviewFilter === 'all' ? undefined : postReviewFilter,
        })

        const mapped: Post[] = (data.list || []).map(item => ({
          id: item.id,
          content: item.content,
          author_name: item.authorName,
          created_at: item.createdAt,
          likes: item.likes ?? 0,
          type: item.type as any,
          subject: item.subject,
          image_url: item.imageUrl,
          is_featured: item.isFeatured,
          review_status: item.reviewStatus as any,
          comment_count: item.commentCount,
          status: item.status as any,
        }))

        const filtered = postSearch.trim()
          ? mapped.filter(p =>
              p.content.includes(postSearch.trim()) ||
              p.author_name.includes(postSearch.trim())
            )
          : mapped

        setPosts(filtered)
      } else if (activeTab === 'announcements') {
        const data = await apiGet<{
          id: string
          title: string
          content: string
          type: 'notice' | 'activity' | 'urgent'
          isTop: boolean
          createdAt: string
        }[]>('/admin/announcements')
        const mapped: Announcement[] = data.map(item => ({
          id: item.id,
          title: item.title,
          content: item.content,
          type: item.type,
          is_top: item.isTop,
          created_at: item.createdAt,
        }))
        setAnnouncements(mapped)
      } else if (activeTab === 'reports') {
        const data = await apiGet<{
          id: string
          postId: string
          userId: string | null
          reason: string
          status: string
          createdAt: string
        }[]>('/admin/reports', {
          status: reportStatusFilter === 'all' ? undefined : reportStatusFilter,
        })
        const mapped: Report[] = data.map(item => ({
          id: item.id,
          post_id: item.postId,
          reason: item.reason,
          status: item.status as any,
          created_at: item.createdAt,
        }))
        setReports(mapped)
      } else if (activeTab === 'appeals') {
        const data = await apiGet<{
          id: string
          postId: string
          userId: string
          reason: string
          status: string
          adminResponse?: string
          adminId?: string
          createdAt: string
          updatedAt: string
        }[]>('/admin/appeals', {
          status: appealStatusFilter === 'all' ? undefined : appealStatusFilter,
        })
        const mapped: Appeal[] = data.map(item => ({
          id: item.id,
          post_id: item.postId,
          user_id: item.userId,
          reason: item.reason,
          status: item.status as any,
          admin_response: item.adminResponse,
          admin_id: item.adminId,
          created_at: item.createdAt,
          updated_at: item.updatedAt,
        }))
        setAppeals(mapped)
      } else if (activeTab === 'suggestions') {
        const data = await apiGet<{
          id: string
          userId?: string
          content: string
          category: string
          status: string
          adminResponse?: string
          adminId?: string
          isAnonymous: boolean
          createdAt: string
          updatedAt: string
        }[]>('/admin/suggestions', {
          category: suggestionCategoryFilter === 'all' ? undefined : suggestionCategoryFilter,
          status: suggestionStatusFilter === 'all' ? undefined : suggestionStatusFilter,
        })
        const mapped: Suggestion[] = data.map(item => ({
          id: item.id,
          user_id: item.userId,
          content: item.content,
          category: item.category as any,
          status: item.status as any,
          admin_response: item.adminResponse,
          admin_id: item.adminId,
          is_anonymous: item.isAnonymous,
          created_at: item.createdAt,
          updated_at: item.updatedAt,
        }))
        setSuggestions(mapped)
      } else if (activeTab === 'moderation') {
        const data = await apiGet<{
          list: {
            id: string
            content: string
            authorName: string
            type: string
            subject?: string
            imageUrl?: string
            likes: number
            commentCount: number
            isFeatured: boolean
            reviewStatus: string
            status: string
            createdAt: string
          }[]
          total: number
          page: number
          size: number
        }>('/admin/posts', {
          page: 1,
          size: 100,
          type: postTypeFilter === 'all' ? undefined : postTypeFilter,
          reviewStatus: 'pending',
        })

        let mapped: Post[] = (data.list || []).map(item => ({
          id: item.id,
          content: item.content,
          author_name: item.authorName,
          created_at: item.createdAt,
          likes: item.likes ?? 0,
          type: item.type as any,
          subject: item.subject,
          image_url: item.imageUrl,
          is_featured: item.isFeatured,
          review_status: item.reviewStatus as any,
          comment_count: item.commentCount,
          status: item.status as any,
        }))

        if (postSearch.trim()) {
          const keyword = postSearch.trim()
          mapped = mapped.filter(p =>
            p.content.includes(keyword) || p.author_name.includes(keyword)
          )
        }

        setPosts(mapped)
      } else if (activeTab === 'dashboard') {
        await fetchChartData()
      } else if (activeTab === 'comments') {
        await fetchComments()
      } else if (activeTab === 'settings') {
        const data = await apiGet<Record<string, string>>('/admin/settings')
        setSystemSettings(data as any)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }, [activeTab, postTypeFilter, postReviewFilter, postSearch, appealStatusFilter, suggestionCategoryFilter, suggestionStatusFilter])

  // 获取评论数据
  const fetchComments = useCallback(async () => {
    try {
      const data = await apiGet<{
        list: {
          id: string
          postId: string
          userId?: string
          content: string
          authorName: string
          likes: number
          createdAt: string
        }[]
        total: number
        page: number
        size: number
      }>('/admin/comments', { page: 1, size: 100 })

      const mapped: Comment[] = (data.list || []).map(item => ({
        id: item.id,
        post_id: item.postId,
        author_name: item.authorName,
        content: item.content,
        created_at: item.createdAt,
        post_title: `帖子ID: ${item.postId}`,
      }))

      setComments(mapped)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }, [])

  // 删除评论
  const handleDeleteComment = useCallback(async (id: string) => {
    if (!confirm('确定要删除这条评论吗？')) return
    try {
      await apiDelete<void>(`/admin/comments/${id}`)
      setComments(comments.filter(c => c.id !== id))
      alert('删除成功')
    } catch (error) {
      console.error('Delete comment error:', error)
      alert('删除失败')
    }
  }, [comments])

  // 获取图表数据（最近7天）- 优化版：一次查询获取所有数据
  const fetchChartData = useCallback(async () => {
    try {
      const data = await apiGet<{ date: string; posts: number; comments: number }[]>(
        '/admin/stats/chart',
        { days: 7 },
      )
      setChartData(data)
    } catch (error) {
      console.error('Error fetching chart data:', error)
    }
  }, [])

  const fetchStats = async () => {
    try {
      const data = await apiGet<{
        totalPosts: number
        studyHelpPosts: number
        confessionPosts: number
        anonymousPosts: number
        announcements: number
        pendingReports: number
        totalComments: number
        totalUsers: number
      }>('/admin/stats')

      setStats({
        totalPosts: Number(data.totalPosts || 0),
        studyHelpPosts: Number(data.studyHelpPosts || 0),
        confessionPosts: Number(data.confessionPosts || 0),
        anonymousPosts: Number(data.anonymousPosts || 0),
        announcements: Number(data.announcements || 0),
        pendingReports: Number(data.pendingReports || 0),
        totalComments: Number(data.totalComments || 0),
        totalUsers: Number(data.totalUsers || 0),
      })
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    }
  }

  // --- Appeals Actions ---
  const handleAppealAction = async (appeal: Appeal, status: 'approved' | 'rejected', response: string) => {
    const label = status === 'approved' ? '通过' : '驳回'

    setAppealActionLoadingId(appeal.id)
    try {
      await apiPut<void>(`/admin/appeals/${appeal.id}`, {
        status,
        adminResponse: response || null,
      })

      setAppeals(prev => prev.map(a => a.id === appeal.id ? { ...a, status, admin_response: response } : a))
      setActionMessage(`已${label}该申诉`)
      setTimeout(() => setActionMessage(null), 2000)
    } catch (err) {
      console.error('handleAppealAction error:', err)
      alert(`${label}失败，请稍后重试`)
    } finally {
      setAppealActionLoadingId(null)
    }
  }

  // --- Suggestions Actions ---
  const handleSuggestionAction = async (
    suggestion: Suggestion,
    nextStatus: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'implemented',
    response: string,
  ) => {
    const labelMap: Record<string, string> = {
      pending: '待处理',
      reviewing: '处理中',
      accepted: '已采纳',
      rejected: '已拒绝',
      implemented: '已实现',
    }

    const label = labelMap[nextStatus] || nextStatus

    setSuggestionActionLoadingId(suggestion.id)
    try {
      await apiPut<void>(`/admin/suggestions/${suggestion.id}`, {
        status: nextStatus,
        adminResponse: response || null,
      })

      setSuggestions(prev => prev.map(s => s.id === suggestion.id ? { ...s, status: nextStatus, admin_response: response } : s))
      setActionMessage(`已将建议标记为「${label}」`)
      setTimeout(() => setActionMessage(null), 2000)
    } catch (err) {
      console.error('handleSuggestionAction error:', err)
      alert('更新失败，请稍后重试')
    } finally {
      setSuggestionActionLoadingId(null)
    }
  }

  const openAppealDialog = (appeal: Appeal, status: 'approved' | 'rejected') => {
    setAppealDialogTarget(appeal)
    setAppealDialogAction(status)
    setAppealDialogResponse(appeal.admin_response || '')
    setAppealDialogOpen(true)
  }

  const closeAppealDialog = () => {
    setAppealDialogOpen(false)
    setAppealDialogTarget(null)
    setAppealDialogAction(null)
    setAppealDialogResponse('')
  }

  const submitAppealDialog = async () => {
    if (!appealDialogTarget || !appealDialogAction) return

    await handleAppealAction(appealDialogTarget, appealDialogAction, appealDialogResponse.trim())
    closeAppealDialog()
  }

  const openSuggestionDialog = (
    suggestion: Suggestion,
    nextStatus: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'implemented',
  ) => {
    setSuggestionDialogTarget(suggestion)
    setSuggestionDialogNextStatus(nextStatus)
    setSuggestionDialogResponse(suggestion.admin_response || '')
    setSuggestionDialogOpen(true)
  }

  const closeSuggestionDialog = () => {
    setSuggestionDialogOpen(false)
    setSuggestionDialogTarget(null)
    setSuggestionDialogNextStatus(null)
    setSuggestionDialogResponse('')
  }

  const submitSuggestionDialog = async () => {
    if (!suggestionDialogTarget || !suggestionDialogNextStatus) return

    await handleSuggestionAction(
      suggestionDialogTarget,
      suggestionDialogNextStatus,
      suggestionDialogResponse.trim(),
    )
    closeSuggestionDialog()
  }

  // --- Post Actions ---
  const handleDeletePost = async (id: string) => {
    if (!confirm('确定要删除这条帖子吗？此操作不可恢复。')) return
    try {
      await apiDelete<void>(`/admin/posts/${id}`)
      setPosts(posts.filter((p) => p.id !== id))
    } catch (error) {
      console.error('Delete post error:', error)
      alert('删除失败')
    }
  }

  const handleToggleFeature = async (post: Post) => {
    try {
      await apiPut<void>(`/admin/posts/${post.id}/feature`, {
        isFeatured: !post.is_featured,
      })
      setPosts(posts.map((p) => (p.id === post.id ? { ...p, is_featured: !p.is_featured } : p)))
    } catch (error) {
      console.error('Toggle feature error:', error)
      alert('更新精选状态失败')
    }
  }

  // --- Moderation Actions ---
  const handleModeration = async (postId: string, status: 'approved' | 'rejected') => {
    const label = status === 'approved' ? '通过' : '驳回'
    if (!confirm(`确定要${label}这条帖子吗？`)) return

    setModerationLoadingId(postId)

    try {
      await apiPut<void>(`/admin/posts/${postId}/review`, { status })

      setPosts(posts.filter((p) => p.id !== postId))
      setActionMessage(`已${label}该帖子`)
      setTimeout(() => setActionMessage(null), 2000)
    } catch (error: any) {
      alert(label + '失败：' + (error?.message || '未知错误'))
    } finally {
      setModerationLoadingId(null)
    }
  }

  // --- Announcement Actions ---
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiPost<void>('/admin/announcements', {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        type: newAnnouncement.type,
        isTop: newAnnouncement.is_top,
      })
      setShowAnnouncementForm(false)
      setNewAnnouncement({ title: '', content: '', type: 'notice', is_top: false })
      fetchData()
    } catch (error: any) {
      alert('发布失败: ' + (error?.message || '未知错误'))
    }
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('确定删除此公告？')) return
    try {
      await apiDelete<void>(`/admin/announcements/${id}`)
      setAnnouncements(announcements.filter((a) => a.id !== id))
    } catch (error) {
      console.error('Delete announcement error:', error)
      alert('删除失败')
    }
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

    try {
      await apiPut<void>(`/admin/announcements/${editingAnnouncementId}`, {
        title: editingAnnouncement.title,
        content: editingAnnouncement.content,
        type: editingAnnouncement.type,
        isTop: editingAnnouncement.is_top,
      })

    setAnnouncements(
      announcements.map((item) => (item.id === editingAnnouncementId ? { ...item, ...editingAnnouncement } : item)),
    )

      setEditingAnnouncementId(null)
      setEditingAnnouncement(null)
    } catch (error: any) {
      alert('更新失败: ' + (error?.message || '未知错误'))
    }
  }

  const handleToggleAnnouncementTop = async (item: Announcement) => {
    try {
      await apiPut<void>(`/admin/announcements/${item.id}/top`, {
        isTop: !item.is_top,
      })
      setAnnouncements(announcements.map((a) => (a.id === item.id ? { ...a, is_top: !item.is_top } : a)))
    } catch (error: any) {
      alert('更新置顶状态失败: ' + (error?.message || '未知错误'))
    }
  }

  // --- Settings Actions ---
  const handleUpdateSetting = async (key: string, value: string) => {
    try {
      const newSettings = { ...systemSettings, [key]: value }
      await apiPut<void>('/admin/settings', newSettings)
      setSystemSettings(prev => ({ ...prev, [key]: value }))
      setActionMessage('设置已保存')
      setTimeout(() => setActionMessage(null), 2000)
    } catch (error: any) {
      alert('保存设置失败: ' + (error?.message || '未知错误'))
    }
  }

  // --- Report Actions ---
  const handleResolveReport = async (id: string, status: 'resolved' | 'ignored') => {
    try {
      await apiPut<void>(`/admin/reports/${id}`, {
        status,
        deletePost: false,
      })
      setReports(reports.map((r) => (r.id === id ? { ...r, status } : r)))
      setActionMessage(status === 'resolved' ? '已标记为已处理' : '已忽略该举报')
      setTimeout(() => setActionMessage(null), 2000)
    } catch (error) {
      console.error('Resolve report error:', error)
    }
  }

  // 删除被举报的帖子
  const handleDeleteReportedPost = async (reportId: string, postId: string) => {
    if (!confirm('确定删除该帖子并标记举报为已处理？')) return
    reportActionLoadingId || setReportActionLoadingId(reportId)

    try {
      await apiPut<void>(`/admin/reports/${reportId}`, {
        status: 'resolved',
        deletePost: true,
      })
      setReports(reports.map((r) => (r.id === reportId ? { ...r, status: 'resolved' } : r)))
      setPosts(posts.filter(p => p.id !== postId))
      setActionMessage('已删除帖子并结案')
      setTimeout(() => setActionMessage(null), 2000)
    } catch (error) {
      console.error('Delete reported post error:', error)
      alert('删除帖子失败')
    } finally {
      setReportActionLoadingId(null)
    }
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
              setActiveTab('appeals')
              setSidebarOpen(false)
            }}
            className={clsx(
              'w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded transition-colors text-sm sm:text-base',
              activeTab === 'appeals'
                ? 'bg-[#0066CC] text-white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white',
            )}
          >
            <Check size={18} /> 申诉管理
          </button>
          <button
            onClick={() => {
              setActiveTab('suggestions')
              setSidebarOpen(false)
            }}
            className={clsx(
              'w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded transition-colors text-sm sm:text-base',
              activeTab === 'suggestions'
                ? 'bg-[#0066CC] text.white'
                : 'text-gray-400 hover:bg-white/5 hover:text-white',
            )}
          >
            <MessageSquare size={18} /> 建议反馈
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

            {appealDialogOpen && appealDialogTarget && appealDialogAction && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl w-full max-w-lg mx-4 p-4 sm:p-6">
                  <h3 className="text-lg font-semibold mb-3">
                    {appealDialogAction === 'approved' ? '通过申诉' : '驳回申诉'}
                  </h3>
                  <div className="text-xs text-gray-400 mb-1">申诉用户：{appealDialogTarget.user_id}</div>
                  <div className="text-xs text-gray-400 mb-3">
                    申诉时间：{new Date(appealDialogTarget.created_at).toLocaleString()}
                  </div>
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">申诉理由</div>
                    <p className="text-sm text-gray-100 whitespace-pre-wrap max-h-32 overflow-auto">
                      {appealDialogTarget.reason}
                    </p>
                  </div>
                  {appealDialogTarget.posts && (
                    <div className="mb-3 bg-black/30 border border-white/5 rounded p-3">
                      <div className="text-xs text-gray-400 mb-1">
                        原帖子 - {appealDialogTarget.posts.author_name}
                      </div>
                      <p className="text-sm text-gray-200 line-clamp-2">
                        {appealDialogTarget.posts.content}
                      </p>
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-1">给用户的回复（可选）</div>
                    <textarea
                      className="w-full bg-black/40 border border-neutral-700 rounded px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[#0066CC]"
                      rows={3}
                      placeholder="可以简单说明处理结果原因，便于用户理解（可留空）"
                      value={appealDialogResponse}
                      onChange={(e) => setAppealDialogResponse(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-3 text-xs">
                    <button
                      onClick={closeAppealDialog}
                      className="px-3 py-1.5 rounded border border-neutral-600 text-gray-300 hover:bg-white/5"
                    >
                      取消
                    </button>
                    <button
                      onClick={submitAppealDialog}
                      disabled={appealActionLoadingId === appealDialogTarget.id}
                      className={clsx(
                        'px-3 py-1.5 rounded text-white',
                        appealDialogAction === 'approved'
                          ? 'bg-green-600 hover:bg-green-500'
                          : 'bg-red-600 hover:bg-red-500',
                        appealActionLoadingId === appealDialogTarget.id && 'opacity-60 cursor-not-allowed',
                      )}
                    >
                      {appealActionLoadingId === appealDialogTarget.id ? '处理中...' : '确认提交'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {suggestionDialogOpen && suggestionDialogTarget && suggestionDialogNextStatus && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl w-full max-w-lg mx-4 p-4 sm:p-6">
                  <h3 className="text-lg font-semibold mb-3">
                    {(() => {
                      const labelMap: Record<string, string> = {
                        pending: '标记为待处理',
                        reviewing: '标记为处理中',
                        accepted: '采纳建议',
                        implemented: '标记为已实现',
                        rejected: '拒绝建议',
                      }
                      return labelMap[suggestionDialogNextStatus] || '更新建议状态'
                    })()}
                  </h3>
                  <div className="text-xs text-gray-400 mb-1">
                    {suggestionDialogTarget.is_anonymous
                      ? '匿名用户'
                      : `用户ID：${suggestionDialogTarget.user_id || '未知'}`}
                  </div>
                  <div className="text-xs text-gray-400 mb-3">
                    提交时间：{new Date(suggestionDialogTarget.created_at).toLocaleString()}
                  </div>
                  <div className="mb-3">
                    <div className="text-xs text-gray-400 mb-1">建议内容</div>
                    <p className="text-sm text-gray-100 whitespace-pre-wrap max-h-32 overflow-auto">
                      {suggestionDialogTarget.content}
                    </p>
                  </div>
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-1">给用户的反馈说明（可选）</div>
                    <textarea
                      className="w-full bg-black/40 border border-neutral-700 rounded px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[#0066CC]"
                      rows={3}
                      placeholder="简单说明处理进度或是否会采纳，方便用户理解（可留空）"
                      value={suggestionDialogResponse}
                      onChange={(e) => setSuggestionDialogResponse(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-3 text-xs">
                    <button
                      onClick={closeSuggestionDialog}
                      className="px-3 py-1.5 rounded border border-neutral-600 text-gray-300 hover:bg-white/5"
                    >
                      取消
                    </button>
                    <button
                      onClick={submitSuggestionDialog}
                      disabled={suggestionActionLoadingId === suggestionDialogTarget.id}
                      className={clsx(
                        'px-3 py-1.5 rounded text-white',
                        suggestionDialogNextStatus === 'rejected'
                          ? 'bg-red-600 hover:bg-red-500'
                          : suggestionDialogNextStatus === 'implemented'
                          ? 'bg-emerald-600 hover:bg-emerald-500'
                          : 'bg-blue-600 hover:bg-blue-500',
                        suggestionActionLoadingId === suggestionDialogTarget.id && 'opacity-60 cursor-not-allowed',
                      )}
                    >
                      {suggestionActionLoadingId === suggestionDialogTarget.id ? '处理中...' : '确认提交'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {actionMessage && (
              <div className="fixed top-4 right-4 z-50">
                <div className="px-4 py-2 rounded-md border border-green-500 bg-black text-xs text-green-300 shadow-lg shadow-black/40">
                  {actionMessage}
                </div>
              </div>
            )}

            {/* Appeals Management */}
            {activeTab === 'appeals' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">申诉管理</h2>

                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs text-gray-300">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>共 {appeals.length} 条申诉</span>
                  </div>
                  <select
                    className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                    value={appealStatusFilter}
                    onChange={(e) => setAppealStatusFilter(e.target.value as any)}
                  >
                    <option value="all">所有状态</option>
                    <option value="pending">待处理</option>
                    <option value="approved">已通过</option>
                    <option value="rejected">已驳回</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {appeals.map((appeal) => (
                    <div key={appeal.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <div className="space-y-1">
                          <span
                            className={clsx(
                              'inline-flex items-center px-2 py-1 rounded text-xs font-bold',
                              appeal.status === 'pending'
                                ? 'bg-yellow-900 text-yellow-400'
                                : appeal.status === 'approved'
                                ? 'bg-green-900 text-green-400'
                                : 'bg-red-900 text-red-400',
                            )}
                          >
                            {appeal.status === 'pending'
                              ? '待处理'
                              : appeal.status === 'approved'
                              ? '已通过'
                              : '已驳回'}
                          </span>
                          <div className="text-xs text-gray-400">
                            申诉时间：{new Date(appeal.created_at).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            用户ID：{appeal.user_id}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          申诉ID：{appeal.id}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-xs text-gray-400 mb-1">申诉理由：</div>
                        <p className="text-sm text-gray-100 whitespace-pre-wrap">{appeal.reason}</p>
                      </div>

                      {appeal.posts && (
                        <div className="mb-3 bg-black/30 border border-white/5 rounded p-3">
                          <div className="text-xs text-gray-400 mb-1">
                            原帖子 - {appeal.posts.author_name}
                          </div>
                          <p className="text-sm text-gray-200 line-clamp-2">{appeal.posts.content}</p>
                          <div className="mt-1 text-xs text-gray-500">
                            发帖时间：{new Date(appeal.posts.created_at).toLocaleString()}
                          </div>
                        </div>
                      )}

                      {appeal.admin_response && (
                        <div className="mb-3 bg-blue-900/20 border border-blue-700/40 rounded p-3 text-xs text-blue-200">
                          管理员回复：{appeal.admin_response}
                        </div>
                      )}

                      {appeal.status === 'pending' && (
                        <div className="flex justify-end gap-3 mt-2">
                          <button
                            onClick={() => openAppealDialog(appeal, 'rejected')}
                            disabled={appealActionLoadingId === appeal.id}
                            className={clsx(
                              'px-3 py-1.5 text-xs rounded border border-yellow-600 text-yellow-400 hover:bg-yellow-900/30',
                              appealActionLoadingId === appeal.id && 'opacity-60 cursor-not-allowed',
                            )}
                          >
                            {appealActionLoadingId === appeal.id ? '处理中...' : '驳回申诉'}
                          </button>
                          <button
                            onClick={() => openAppealDialog(appeal, 'approved')}
                            disabled={appealActionLoadingId === appeal.id}
                            className={clsx(
                              'px-3 py-1.5 text-xs rounded bg-green-600 text-white hover:bg-green-500',
                              appealActionLoadingId === appeal.id && 'opacity-60 cursor-not-allowed',
                            )}
                          >
                            {appealActionLoadingId === appeal.id ? '处理中...' : '通过并恢复帖子'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {appeals.length === 0 && (
                    <div className="text-center text-gray-500 py-10">暂无申诉记录</div>
                  )}
                </div>
              </div>
            )}

            {/* Suggestions Management */}
            {activeTab === 'suggestions' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">建议管理</h2>

                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs text-gray-300">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>共 {suggestions.length} 条建议</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                      value={suggestionCategoryFilter}
                      onChange={(e) => setSuggestionCategoryFilter(e.target.value as any)}
                    >
                      <option value="all">所有类型</option>
                      <option value="feature">功能建议</option>
                      <option value="bug">Bug 反馈</option>
                      <option value="improvement">体验优化</option>
                      <option value="general">其他</option>
                    </select>
                    <select
                      className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-xs text-white"
                      value={suggestionStatusFilter}
                      onChange={(e) => setSuggestionStatusFilter(e.target.value as any)}
                    >
                      <option value="all">所有状态</option>
                      <option value="pending">待处理</option>
                      <option value="reviewing">处理中</option>
                      <option value="accepted">已采纳</option>
                      <option value="implemented">已实现</option>
                      <option value="rejected">已拒绝</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {suggestions.map((s) => (
                    <div key={s.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={clsx(
                                'px-2 py-1 rounded font-bold',
                                s.category === 'feature'
                                  ? 'bg-blue-900 text-blue-300'
                                  : s.category === 'bug'
                                  ? 'bg-red-900 text-red-300'
                                  : s.category === 'improvement'
                                  ? 'bg-green-900 text-green-300'
                                  : 'bg-gray-800 text-gray-300',
                              )}
                            >
                              {s.category === 'feature'
                                ? '功能建议'
                                : s.category === 'bug'
                                ? 'Bug 反馈'
                                : s.category === 'improvement'
                                ? '体验优化'
                                : '其他建议'}
                            </span>
                            <span
                              className={clsx(
                                'px-2 py-1 rounded text-xs',
                                s.status === 'pending'
                                  ? 'bg-yellow-900 text-yellow-400'
                                  : s.status === 'reviewing'
                                  ? 'bg-blue-900 text-blue-300'
                                  : s.status === 'accepted'
                                  ? 'bg-green-900 text-green-300'
                                  : s.status === 'implemented'
                                  ? 'bg-emerald-900 text-emerald-300'
                                  : 'bg-gray-800 text-gray-300',
                              )}
                            >
                              {s.status === 'pending'
                                ? '待处理'
                                : s.status === 'reviewing'
                                ? '处理中'
                                : s.status === 'accepted'
                                ? '已采纳'
                                : s.status === 'implemented'
                                ? '已实现'
                                : '已拒绝'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {s.is_anonymous ? '匿名用户' : `用户ID：${s.user_id || '未知'}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            提交时间：{new Date(s.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">ID：{s.id}</div>
                      </div>

                      <p className="text-sm text-gray-100 whitespace-pre-wrap mb-2">{s.content}</p>

                      {s.admin_response && (
                        <div className="mb-2 bg-blue-900/20 border border-blue-700/40 rounded p-3 text-xs text-blue-200">
                          管理员回复：{s.admin_response}
                        </div>
                      )}

                      <div className="flex flex-wrap justify-end gap-2 mt-2 text-xs">
                        <button
                          onClick={() => openSuggestionDialog(s, 'reviewing')}
                          disabled={suggestionActionLoadingId === s.id}
                          className={clsx(
                            'px-3 py-1.5 rounded border border-blue-600 text-blue-300 hover:bg-blue-900/30',
                            suggestionActionLoadingId === s.id && 'opacity-60 cursor-not-allowed',
                          )}
                        >
                          {suggestionActionLoadingId === s.id ? '处理中...' : '标记处理中'}
                        </button>
                        <button
                          onClick={() => openSuggestionDialog(s, 'accepted')}
                          disabled={suggestionActionLoadingId === s.id}
                          className={clsx(
                            'px-3 py-1.5 rounded border border-green-600 text-green-300 hover:bg-green-900/30',
                            suggestionActionLoadingId === s.id && 'opacity-60 cursor-not-allowed',
                          )}
                        >
                          {suggestionActionLoadingId === s.id ? '处理中...' : '采纳建议'}
                        </button>
                        <button
                          onClick={() => openSuggestionDialog(s, 'implemented')}
                          disabled={suggestionActionLoadingId === s.id}
                          className={clsx(
                            'px-3 py-1.5 rounded border border-emerald-600 text-emerald-300 hover:bg-emerald-900/30',
                            suggestionActionLoadingId === s.id && 'opacity-60 cursor-not-allowed',
                          )}
                        >
                          {suggestionActionLoadingId === s.id ? '处理中...' : '标记已实现'}
                        </button>
                        <button
                          onClick={() => openSuggestionDialog(s, 'rejected')}
                          disabled={suggestionActionLoadingId === s.id}
                          className={clsx(
                            'px-3 py-1.5 rounded border border-red-600 text-red-300 hover:bg-red-900/30',
                            suggestionActionLoadingId === s.id && 'opacity-60 cursor-not-allowed',
                          )}
                        >
                          {suggestionActionLoadingId === s.id ? '处理中...' : '拒绝'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {suggestions.length === 0 && (
                    <div className="text-center text-gray-500 py-10">暂无建议记录</div>
                  )}
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
                          <td className="p-4 align-top max-w-md">
                            <div className="truncate" title={post.content}>
                              {post.content}
                            </div>
                            {post.image_url && (
                              <div className="mt-2">
                                <img
                                  src={post.image_url}
                                  alt="帖子图片预览"
                                  className="w-32 h-20 object-cover rounded border border-white/10"
                                />
                              </div>
                            )}
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

