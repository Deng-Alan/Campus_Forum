'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types'
import { Trash2, LogOut } from 'lucide-react'
import clsx from 'clsx'

export default function AdminDashboard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = Cookies.get('admin_token')
    if (!token) {
      router.push('/admin/login')
      return
    }
    fetchPosts()
  }, [router])

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条帖子吗？此操作不可恢复。')) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // 更新本地列表
      setPosts(posts.filter(post => post.id !== id))
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('删除失败，请检查权限或网络连接')
    }
  }

  const handleToggleFeature = async (post: Post) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_featured: !post.is_featured })
        .eq('id', post.id)

      if (error) throw error
      
      // 更新本地列表
      setPosts(posts.map(p => p.id === post.id ? { ...p, is_featured: !p.is_featured } : p))
    } catch (error) {
        console.error('Error updating post:', error)
    }
  }

  const handleLogout = () => {
    Cookies.remove('admin_token')
    router.push('/admin/login')
  }

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">加载中...</div>

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">后台管理系统</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 border border-red-900 text-red-500 rounded hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>

        <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-800 text-neutral-400">
              <tr>
                <th className="p-4">类型</th>
                <th className="p-4">内容摘要</th>
                <th className="p-4">作者</th>
                <th className="p-4">发布时间</th>
                <th className="p-4">状态</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-neutral-800/50">
                  <td className="p-4">
                     <span className={clsx(
                        "text-xs px-2 py-1 rounded-full border",
                        post.type === 'study_help' ? "border-blue-500 text-blue-500" :
                        post.type === 'confession' ? "border-pink-500 text-pink-500" :
                        "border-gray-500 text-gray-500"
                     )}>
                        {post.type === 'study_help' ? '学习互助' : 
                         post.type === 'confession' ? '表白墙' : 
                         post.type === 'campus_fun' ? '校园趣事' : '匿名树洞'}
                     </span>
                  </td>
                  <td className="p-4 max-w-xs truncate" title={post.content}>
                    {post.content}
                  </td>
                  <td className="p-4 text-neutral-300">{post.author_name}</td>
                  <td className="p-4 text-neutral-500">
                    {new Date(post.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                     {post.is_featured && <span className="text-red-400 font-bold text-xs">精选置顶</span>}
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button
                        onClick={() => handleToggleFeature(post)}
                        className={clsx("p-2 rounded transition-colors", post.is_featured ? "text-yellow-500 hover:bg-yellow-900/20" : "text-gray-500 hover:text-yellow-500")}
                        title={post.is_featured ? "取消精选" : "设为精选"}
                    >
                        ⭐
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-500 hover:text-red-400 p-2 hover:bg-red-900/20 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    暂无帖子
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
