'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Edit2, Check, X, Camera } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import clsx from 'clsx'

export function UserSettings() {
  const { getDisplayName } = useUser()
  const { user: authUser, updateAvatar, updateUsername, updateNickname, updatePassword } = useAuth()
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 编辑状态
  const [editingField, setEditingField] = useState<'username' | 'nickname' | 'password' | null>(null)
  const [tempUsername, setTempUsername] = useState('')
  const [tempNickname, setTempNickname] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  useEffect(() => {
    if (authUser) {
      setTempUsername(authUser.username)
      setTempNickname(authUser.nickname)
    }
  }, [authUser])


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
          upsert: false // 不覆盖已有文件，避免权限问题
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
      
      {
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
          </div>
          
          <p className="text-xs text-gray-500">
            你的昵称和头像将在发帖和评论时显示
          </p>
        </div>
      }
    </div>
  )
}
