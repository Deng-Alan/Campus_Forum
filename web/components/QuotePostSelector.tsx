'use client'

import { useState, useEffect } from 'react'
import { X, Search, Quote } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Post } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface QuotePostSelectorProps {
  onSelect: (post: Post) => void
  onClose: () => void
  currentUserId?: string
}

export function QuotePostSelector({ onSelect, onClose, currentUserId }: QuotePostSelectorProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'mine'>('all')

  useEffect(() => {
    fetchPosts()
  }, [filter])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('posts')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(50)

      if (filter === 'mine' && currentUserId) {
        query = query.eq('user_id', currentUserId)
      }

      const { data, error } = await query

      if (error) throw error
      setPosts(data || [])
    } catch (err) {
      console.error('Fetch posts error:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(post =>
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col border border-neutral-800">
        {/* 头部 */}
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Quote className="w-5 h-5" />
              选择要引用的帖子
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-neutral-800 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 搜索和过滤 */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索帖子内容..."
                className="w-full bg-black border border-neutral-700 rounded pl-10 pr-3 py-2 text-sm focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-1 bg-neutral-800 rounded p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filter === 'all' ? 'bg-blue-600' : 'hover:bg-neutral-700'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilter('mine')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filter === 'mine' ? 'bg-blue-600' : 'hover:bg-neutral-700'
                }`}
              >
                我的
              </button>
            </div>
          </div>
        </div>

        {/* 帖子列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? '没有找到相关帖子' : '暂无帖子'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => {
                    onSelect(post)
                    onClose()
                  }}
                  className="w-full p-3 bg-neutral-800 hover:bg-neutral-700 rounded border border-neutral-700 hover:border-blue-500 transition-all text-left group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{post.author_name}</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(post.created_at), { 
                            addSuffix: true,
                            locale: zhCN 
                          })}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 text-gray-300">
                        {post.content}
                      </p>
                      {post.image_url && (
                        <div className="mt-2">
                          <span className="text-xs text-blue-400">📷 含图片</span>
                        </div>
                      )}
                    </div>
                    <Quote className="w-5 h-5 text-gray-500 group-hover:text-blue-500 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50">
          <p className="text-xs text-gray-500 text-center">
            💡 点击帖子即可引用
          </p>
        </div>
      </div>
    </div>
  )
}
