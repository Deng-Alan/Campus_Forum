'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Edit2, Check, X, Camera } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import clsx from 'clsx'

export function UserSettings() {
  const { user, updateNickname, getDisplayName } = useUser()
  const { user: authUser, updateAvatar } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [tempNickname, setTempNickname] = useState('')
  const [error, setError] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件')
      return
    }

    // 验证文件大小（最大 2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('头像大小不能超过 2MB')
      return
    }

    setUploadingAvatar(true)

    try {
      // 生成唯一文件名（移除用户名中的特殊字符）
      const fileExt = file.name.split('.').pop()
      const safeUsername = authUser?.username.replace(/[^a-zA-Z0-9]/g, '_') || 'user'
      const fileName = `avatar_${safeUsername}_${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // 上传到 Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // 获取公开 URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      // 更新用户头像
      updateAvatar(publicUrl)
      alert('头像更新成功！')
    } catch (err) {
      console.error('Upload error:', err)
      alert('头像上传失败，请重试')
    } finally {
      setUploadingAvatar(false)
    }
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
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* 头像 */}
              <div className="relative group">
                {authUser?.avatar ? (
                  <img 
                    src={authUser.avatar} 
                    alt="Avatar" 
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-white/10">
                    {getDisplayName().charAt(0)}
                  </div>
                )}
                
                {/* 头像上传按钮 */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="更换头像"
                >
                  {uploadingAvatar ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Camera size={20} className="text-white" />
                  )}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              
              <div>
                <span className="text-white font-medium block">{getDisplayName()}</span>
                <span className="text-xs text-gray-500">悬停头像更换</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors"
            >
              <Edit2 size={14} />
              修改昵称
            </button>
          </div>
          
          <p className="text-xs text-gray-500">
            {user.nickname === '某位同学' 
              ? '还没有设置昵称，点击修改来设置吧！' 
              : '你的昵称和头像将在发帖和评论时显示'}
          </p>
        </div>
      )}
    </div>
  )
}
