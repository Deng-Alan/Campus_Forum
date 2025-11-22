'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, TrendingUp } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'

interface LeaderboardUser {
  author_name: string
  post_count: number
  comment_count: number
  total_likes: number
  score: number
}

export function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [daysFilter, setDaysFilter] = useState(7) // 默认查看最近 7 天
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null) // 学科筛选

  useEffect(() => {
    fetchLeaderboard()
  }, [daysFilter, subjectFilter])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_study_leaderboard', { 
        days_limit: daysFilter,
        subject_filter: subjectFilter 
      })
      
      if (error) {
        console.error('Error fetching leaderboard:', error)
        return
      }
      
      setLeaders(data || [])
    } catch (err) {
      console.error('Leaderboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-neutral-900 border border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-yellow-500">
          <Trophy size={20} />
          <h3 className="font-bold text-lg">学霸排行榜</h3>
        </div>
        
        {/* 时间筛选 */}
        <select
          value={daysFilter}
          onChange={(e) => setDaysFilter(Number(e.target.value))}
          className="bg-neutral-800 text-xs text-white rounded px-2 py-1 border border-neutral-700 outline-none focus:border-blue-500"
        >
          <option value={7}>本周</option>
          <option value={30}>本月</option>
          <option value={365}>全年</option>
        </select>
      </div>
      
      {/* 学科筛选 */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button
          onClick={() => setSubjectFilter(null)}
          className={clsx(
            "px-2.5 py-1 text-xs rounded transition-colors",
            subjectFilter === null 
              ? "bg-blue-600 text-white" 
              : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
          )}
        >
          全部
        </button>
        {['数学', '物理', '化学', '生物', '英语', '语文'].map(subject => (
          <button
            key={subject}
            onClick={() => setSubjectFilter(subject)}
            className={clsx(
              "px-2.5 py-1 text-xs rounded transition-colors",
              subjectFilter === subject 
                ? "bg-blue-600 text-white" 
                : "bg-neutral-800 text-gray-400 hover:bg-neutral-700"
            )}
          >
            {subject}
          </button>
        ))}
      </div>
      
      {loading ? (
        <div className="text-center py-8 text-gray-500 text-sm">加载中...</div>
      ) : leaders.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
          <p>暂无数据</p>
          <p className="text-xs mt-1">快去"学习互助"板块答题吧！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((user, index) => {
            const rank = index + 1
            return (
              <div key={user.author_name + rank} className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={clsx(
                    "w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold flex-shrink-0",
                    rank === 1 ? "bg-yellow-500 text-black" :
                    rank === 2 ? "bg-gray-300 text-black" :
                    rank === 3 ? "bg-orange-400 text-black" :
                    "bg-neutral-800 text-gray-400"
                  )}>
                    {rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white truncate">{user.author_name}</div>
                    <div className="text-xs text-gray-500">
                      {user.post_count > 0 && `${user.post_count}题`}
                      {user.post_count > 0 && user.comment_count > 0 && ' · '}
                      {user.comment_count > 0 && `${user.comment_count}答`}
                      {(user.post_count > 0 || user.comment_count > 0) && user.total_likes > 0 && ' · '}
                      {user.total_likes > 0 && `${user.total_likes}赞`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-blue-400 text-sm font-bold flex-shrink-0 ml-2">
                  <Medal size={14} />
                  {Math.round(user.score)}
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-white/10 text-center">
        <p className="text-xs text-gray-500">
          积分规则：发题 +2分，答题 +1分，获赞 +0.5分
        </p>
      </div>
    </div>
  )
}
