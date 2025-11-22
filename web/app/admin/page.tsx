'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { supabase } from '@/lib/supabase'
import { Post, Announcement, Report } from '@/types'
import { Trash2, LogOut, Megaphone, FileText, AlertTriangle, Check, X, Plus } from 'lucide-react'
import clsx from 'clsx'

type Tab = 'posts' | 'announcements' | 'reports'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('posts')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Data States
  const [posts, setPosts] = useState<Post[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [reports, setReports] = useState<Report[]>([])

  // New Announcement State
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', type: 'notice', is_top: false })
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)

  useEffect(() => {
    const token = Cookies.get('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchData()
  }, [router, activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'posts') {
        const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
        setPosts(data || [])
      } else if (activeTab === 'announcements') {
        const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
        setAnnouncements(data || [])
      } else if (activeTab === 'reports') {
        // 联表查询被举报的帖子信息
        const { data } = await supabase.from('reports').select('*, posts(*)').order('created_at', { ascending: false })
        setReports(data as any || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // --- Post Actions ---
  const handleDeletePost = async (id: string) => {
    if (!confirm('确定要删除这条帖子吗？此操作不可恢复。')) return
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (!error) setPosts(posts.filter(p => p.id !== id))
  }

  const handleToggleFeature = async (post: Post) => {
    const { error } = await supabase.from('posts').update({ is_featured: !post.is_featured }).eq('id', post.id)
    if (!error) setPosts(posts.map(p => p.id === post.id ? { ...p, is_featured: !p.is_featured } : p))
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
    if (!error) setAnnouncements(announcements.filter(a => a.id !== id))
  }

  // --- Report Actions ---
  const handleResolveReport = async (id: string, status: 'resolved' | 'ignored') => {
    const { error } = await supabase.from('reports').update({ status }).eq('id', id)
    if (!error) setReports(reports.map(r => r.id === id ? { ...r, status } : r))
  }

  // 删除被举报的帖子
  const handleDeleteReportedPost = async (reportId: string, postId: string) => {
    if (!confirm('确定删除该帖子并标记举报为已处理？')) return
    // 1. 删除帖子
    const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId)
    if (deleteError) {
      alert('删除帖子失败')
      return
    }
    // 2. 更新举报状态
    await handleResolveReport(reportId, 'resolved')
  }

  const handleLogout = () => {
    Cookies.remove('admin_token')
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-neutral-900 border-r border-white/10 p-6 flex flex-col">
        <h1 className="text-xl font-bold text-[#0066CC] mb-8">三中论坛后台</h1>
        
        <nav className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('posts')}
            className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded transition-colors", activeTab === 'posts' ? "bg-[#0066CC] text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}
          >
            <FileText size={18} /> 帖子管理
          </button>
          <button 
            onClick={() => setActiveTab('announcements')}
            className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded transition-colors", activeTab === 'announcements' ? "bg-[#0066CC] text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}
          >
            <Megaphone size={18} /> 公告管理
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={clsx("w-full flex items-center gap-3 px-4 py-3 rounded transition-colors", activeTab === 'reports' ? "bg-[#0066CC] text-white" : "text-gray-400 hover:bg-white/5 hover:text-white")}
          >
            <AlertTriangle size={18} /> 举报处理
          </button>
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-400 px-4 py-2 mt-auto">
          <LogOut size={18} /> 退出登录
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto h-screen">
        {loading ? (
          <div className="text-center text-gray-500 mt-20">加载中...</div>
        ) : (
          <>
            {/* Posts Management */}
            {activeTab === 'posts' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">帖子管理</h2>
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
                      {posts.map(post => (
                        <tr key={post.id} className="hover:bg-neutral-800/50">
                          <td className="p-4"><span className="text-xs border border-gray-600 px-2 py-1 rounded text-gray-400">{post.type}</span></td>
                          <td className="p-4 max-w-md truncate" title={post.content}>{post.content}</td>
                          <td className="p-4 text-gray-300">{post.author_name}</td>
                          <td className="p-4 text-gray-500">{new Date(post.created_at).toLocaleDateString()}</td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button onClick={() => handleToggleFeature(post)} className={clsx("p-2 rounded", post.is_featured ? "text-yellow-500" : "text-gray-600 hover:text-yellow-500")}>⭐</button>
                            <button onClick={() => handleDeletePost(post.id)} className="p-2 text-red-500 hover:bg-red-900/20 rounded"><Trash2 size={16}/></button>
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
                  <button onClick={() => setShowAnnouncementForm(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2">
                    <Plus size={18} /> 发布公告
                  </button>
                </div>

                {showAnnouncementForm && (
                  <form onSubmit={handleCreateAnnouncement} className="bg-neutral-800 p-6 rounded-lg mb-8 border border-neutral-700">
                    <div className="grid gap-4">
                      <input 
                        type="text" 
                        placeholder="公告标题" 
                        className="bg-neutral-900 border border-neutral-700 p-2 rounded text-white"
                        value={newAnnouncement.title}
                        onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                        required
                      />
                      <textarea 
                        placeholder="公告内容" 
                        className="bg-neutral-900 border border-neutral-700 p-2 rounded text-white h-24"
                        value={newAnnouncement.content}
                        onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                      />
                      <div className="flex gap-4">
                        <select 
                          className="bg-neutral-900 border border-neutral-700 p-2 rounded text-white"
                          value={newAnnouncement.type}
                          onChange={e => setNewAnnouncement({...newAnnouncement, type: e.target.value as any})}
                        >
                          <option value="notice">普通通知</option>
                          <option value="activity">校园活动</option>
                          <option value="urgent">紧急通知</option>
                        </select>
                        <label className="flex items-center gap-2 text-gray-300">
                          <input 
                            type="checkbox" 
                            checked={newAnnouncement.is_top}
                            onChange={e => setNewAnnouncement({...newAnnouncement, is_top: e.target.checked})}
                          /> 置顶显示
                        </label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAnnouncementForm(false)} className="px-4 py-2 text-gray-400 hover:text-white">取消</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">发布</button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="bg-neutral-900 rounded-lg border border-neutral-800">
                  {announcements.map(item => (
                    <div key={item.id} className="p-4 border-b border-neutral-800 flex justify-between items-center last:border-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {item.is_top && <span className="text-red-400 text-xs border border-red-400 px-1 rounded">置顶</span>}
                          <span className={clsx("text-xs px-2 py-0.5 rounded-full", item.type === 'urgent' ? 'bg-orange-900 text-orange-400' : item.type === 'activity' ? 'bg-green-900 text-green-400' : 'bg-blue-900 text-blue-400')}>
                            {item.type === 'urgent' ? '紧急' : item.type === 'activity' ? '活动' : '通知'}
                          </span>
                          <h3 className="font-bold">{item.title}</h3>
                        </div>
                        <p className="text-gray-400 text-sm">{item.content}</p>
                      </div>
                      <button onClick={() => handleDeleteAnnouncement(item.id)} className="text-red-500 hover:bg-red-900/20 p-2 rounded">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reports Management */}
            {activeTab === 'reports' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">举报处理</h2>
                <div className="space-y-4">
                  {reports.map(report => (
                    <div key={report.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            "px-2 py-1 rounded text-xs font-bold",
                            report.status === 'pending' ? "bg-yellow-900 text-yellow-500" : 
                            report.status === 'resolved' ? "bg-green-900 text-green-500" : "bg-gray-800 text-gray-500"
                          )}>
                            {report.status === 'pending' ? '待处理' : report.status === 'resolved' ? '已处理' : '已忽略'}
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
                          <div className="text-xs text-gray-500 mb-1">被举报帖子 - {report.posts.author_name}:</div>
                          <p className="text-gray-300 text-sm">{report.posts.content}</p>
                        </div>
                      ) : (
                        <div className="text-gray-500 italic mb-4">（原贴已被删除）</div>
                      )}

                      {/* Actions */}
                      {report.status === 'pending' && report.posts && (
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => handleResolveReport(report.id, 'ignored')}
                            className="px-3 py-1.5 text-gray-400 hover:text-white text-sm border border-gray-700 rounded hover:bg-gray-800"
                          >
                            忽略举报
                          </button>
                          <button 
                            onClick={() => handleDeleteReportedPost(report.id, report.post_id)}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-500 flex items-center gap-1"
                          >
                            <Trash2 size={14} /> 删除帖子并结案
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {reports.length === 0 && (
                    <div className="text-center text-gray-500 py-10">暂无举报记录</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
