'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Edit2, Check, X, Camera } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useAuth } from '@/hooks/useAuth'
import { API_BASE_URL, getAuthHeader } from '@/lib/api'
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


  const handleSaveUsername = async () => {
    if (!tempUsername.trim()) {
      alert('用户名不能为空')
      return
    }
    if (tempUsername.length < 3) {
      alert('用户名至少需要3个字符')
      return
    }
    const result = await updateUsername(tempUsername)
    alert(result.message)
    if (result.success) {
      setEditingField(null)
    }
  }

  const handleSaveNickname = async () => {
    if (!tempNickname.trim()) {
      alert('昵称不能为空')
      return
    }
    if (tempNickname.length < 2) {
      alert('昵称至少需要2个字符')
      return
    }
    const result = await updateNickname(tempNickname)
    alert(result.message)
    if (result.success) {
      setEditingField(null)
    }
  }

  const handleSavePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert('请填写完整信息')
      return
    }
    if (newPassword.length < 6) {
      alert('新密码至少需要6个字符')
      return
    }
    if (newPassword !== confirmPassword) {
      alert('两次输入的新密码不一致')
      return
    }
    const result = await updatePassword(oldPassword, newPassword)
    alert(result.message)
    if (result.success) {
      setEditingField(null)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  const handleCancel = () => {
    setEditingField(null)
    if (authUser) {
      setTempUsername(authUser.username)
      setTempNickname(authUser.nickname)
    }
    setOldPassword('')
    setNewPassword('')
    setConfirmPassword('')
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
      const formData = new FormData()
      formData.append('file', file)

      const url = `${API_BASE_URL}/upload/image?type=avatar`
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
        },
        body: formData,
      })

      const json: any = await res.json()
      if (!res.ok || json.code !== 200 || !json.data?.url) {
        throw new Error(json.message || '上传失败')
      }

      const publicUrl = json.data.url as string
      await updateAvatar(publicUrl)
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
      <div className="flex items-center gap-2 mb-4">
        <User size={18} className="text-blue-400" />
        <h3 className="font-bold text-white">个人信息</h3>
      </div>
      
      <div className="space-y-4">
        {/* 头像 */}
        <div>
          <label className="text-xs text-gray-400 block mb-2">头像</label>
          <div className="flex items-center gap-3">
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
            <span className="text-xs text-gray-500">悬停头像更换</span>
          </div>
        </div>

        {/* 用户名 */}
        <div>
          <label className="text-xs text-gray-400 block mb-2">用户名（登录用）</label>
          {editingField === 'username' ? (
            <div className="space-y-2">
              <input
                type="text"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm text-white"
                placeholder="输入新用户名"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveUsername}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  <Check size={14} /> 保存
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded text-sm"
                >
                  <X size={14} /> 取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-black border border-neutral-700 rounded px-3 py-2">
              <span className="text-white text-sm">{authUser?.username}</span>
              <button
                onClick={() => setEditingField('username')}
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
              >
                <Edit2 size={14} /> 修改
              </button>
            </div>
          )}
        </div>

        {/* 昵称 */}
        <div>
          <label className="text-xs text-gray-400 block mb-2">昵称（显示用）</label>
          {editingField === 'nickname' ? (
            <div className="space-y-2">
              <input
                type="text"
                value={tempNickname}
                onChange={(e) => setTempNickname(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm text-white"
                placeholder="输入新昵称"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNickname}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  <Check size={14} /> 保存
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded text-sm"
                >
                  <X size={14} /> 取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-black border border-neutral-700 rounded px-3 py-2">
              <span className="text-white text-sm">{authUser?.nickname}</span>
              <button
                onClick={() => setEditingField('nickname')}
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
              >
                <Edit2 size={14} /> 修改
              </button>
            </div>
          )}
        </div>

        {/* 密码 */}
        <div>
          <label className="text-xs text-gray-400 block mb-2">密码</label>
          {editingField === 'password' ? (
            <div className="space-y-2">
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm text-white"
                placeholder="输入原密码"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm text-white"
                placeholder="输入新密码"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black border border-neutral-700 rounded px-3 py-2 text-sm text-white"
                placeholder="确认新密码"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSavePassword}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  <Check size={14} /> 保存
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 rounded text-sm"
                >
                  <X size={14} /> 取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-black border border-neutral-700 rounded px-3 py-2">
              <span className="text-gray-500 text-sm">••••••••</span>
              <button
                onClick={() => setEditingField('password')}
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
              >
                <Edit2 size={14} /> 修改
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 pt-2">
          💡 修改用户名后需要使用新用户名登录
        </p>
      </div>
    </div>
  )
}
