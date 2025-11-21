'use client'

import { useState, useEffect } from 'react'
import { User, Edit2, Check, X } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import clsx from 'clsx'

export function UserSettings() {
  const { user, updateNickname, getDisplayName } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [tempNickname, setTempNickname] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setTempNickname(user.nickname)
  }, [user.nickname])

  const handleSave = () => {
    const trimmed = tempNickname.trim()
    
    // 验证昵称
    if (!trimmed) {
      setError('昵称不能为空')
      return
    }
    
    if (trimmed.length > 20) {
      setError('昵称不能超过20个字符')
      return
    }
    
    // 过滤敏感词
    const forbidden = ['管理员', 'admin', '校长', '老师']
    if (forbidden.some(word => trimmed.toLowerCase().includes(word))) {
      setError('昵称包含敏感词')
      return
    }
    
    updateNickname(trimmed)
    setIsEditing(false)
    setError('')
  }

  const handleCancel = () => {
    setTempNickname(user.nickname)
    setIsEditing(false)
    setError('')
  }

  return (
    <div className="bg-neutral-900 border border-white/10 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <User size={18} className="text-blue-400" />
        <h3 className="font-bold text-white">个人信息</h3>
      </div>
      
      {isEditing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={tempNickname}
            onChange={(e) => setTempNickname(e.target.value)}
            placeholder="输入你的昵称..."
            maxLength={20}
            className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
          
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              <Check size={14} />
              保存
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded text-sm font-medium transition-colors"
            >
              <X size={14} />
              取消
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            💡 提示：设置昵称后，发帖和评论将显示你的昵称
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {getDisplayName().charAt(0)}
              </div>
              <span className="text-white font-medium">{getDisplayName()}</span>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors"
            >
              <Edit2 size={14} />
              修改
            </button>
          </div>
          
          <p className="text-xs text-gray-500">
            {user.nickname === '某位同学' 
              ? '还没有设置昵称，点击修改来设置吧！' 
              : '你的昵称将在发帖和评论时显示'}
          </p>
        </div>
      )}
    </div>
  )
}
