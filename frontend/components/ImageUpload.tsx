'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { API_BASE_URL, getAuthHeader } from '@/lib/api'

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  currentImage?: string
  onRemove?: () => void
}

export function ImageUpload({ onImageUploaded, currentImage, onRemove }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentImage || '')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件')
      return
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const url = `${API_BASE_URL}/upload/image?type=post`
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
      setPreview(publicUrl)
      onImageUploaded(publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
      setError('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview('')
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onRemove?.()
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/30">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full max-h-64 object-cover"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-neutral-700 hover:border-blue-500 rounded-lg cursor-pointer transition-colors bg-black/30 hover:bg-black/50"
          >
            {uploading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-sm text-gray-400">上传中...</p>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="mx-auto mb-2 text-gray-500" size={32} />
                <p className="text-sm text-gray-400 mb-1">点击上传图片</p>
                <p className="text-xs text-gray-600">支持 JPG、PNG、GIF，最大 5MB</p>
              </div>
            )}
          </label>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </div>
  )
}
