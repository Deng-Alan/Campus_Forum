import { Post, PostType } from '@/types'
import { Heart, Share2, MessageCircle, BookOpen, Laugh, GraduationCap, Check, Flag, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import clsx from 'clsx'
import { useState } from 'react'
import { CommentSection } from './CommentSection'
import { sharePost } from '@/lib/share-utils'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface PostCardProps {
  post: Post
  onLike?: (id: string) => void
  onDelete?: (id: string) => void
  currentUsername?: string
}

const TypeIcon = ({ type }: { type: PostType }) => {
  switch (type) {
    case 'study_help': return <GraduationCap size={16} className="text-blue-400" />
    case 'campus_fun': return <Laugh size={16} className="text-orange-400" />
    case 'confession': return <Heart size={16} className="text-pink-400" />
    default: return <MessageCircle size={16} className="text-gray-400" />
  }
}

const TypeLabel = ({ type, subject }: { type: PostType, subject?: string }) => {
  switch (type) {
    case 'study_help': return <span className="text-blue-400 text-xs border border-blue-400/30 px-2 py-0.5 rounded-full">{subject || '学习互助'}</span>
    case 'campus_fun': return <span className="text-orange-400 text-xs border border-orange-400/30 px-2 py-0.5 rounded-full">校园趣事</span>
    case 'confession': return <span className="text-pink-400 text-xs border border-pink-400/30 px-2 py-0.5 rounded-full">表白墙</span>
    default: return <span className="text-gray-400 text-xs border border-gray-400/30 px-2 py-0.5 rounded-full">匿名吐槽</span>
  }
}

export function PostCard({ post, onLike, onDelete, currentUsername }: PostCardProps) {
  const { user } = useAuth()
  const isConfession = post.type === 'confession';
  const [showComments, setShowComments] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  // 判断是否为当前用户的帖子（匿名帖子不显示删除按钮）
  const isOwnPost = user && post.author_name === user.username && post.type !== 'anonymous' && post.type !== 'confession'

  const handleShare = async () => {
    const result = await sharePost(post.id, post.content, post.type)
    if (result.success) {
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 2000)
    } else {
      alert(result.message)
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这条帖子吗？删除后无法恢复。')) return
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
      
      if (error) throw error
      
      alert('删除成功！')
      if (onDelete) {
        onDelete(post.id)
      } else {
        // 如果没有传 onDelete 回调，刷新页面
        window.location.reload()
      }
    } catch (e) {
      console.error(e)
      alert('删除失败，请重试')
    }
  }

  const handleReport = async () => {
    const reason = window.prompt('请填写举报理由（如：广告、违规内容）：')
    if (reason) {
      try {
        const { error } = await supabase
          .from('reports')
          .insert([{ post_id: post.id, reason }])
        
        if (error) throw error
        alert('举报成功，管理员会尽快处理！')
      } catch (e) {
        console.error(e)
        alert('举报提交失败')
      }
    }
  }
  
  return (
    <div className={clsx(
      "p-4 border rounded-lg mb-4 transition-all hover:border-opacity-50",
      isConfession 
        ? "bg-gradient-to-br from-neutral-900 to-pink-900/10 border-pink-500/20" 
        : "bg-neutral-900 border-white/10"
    )}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          {/* 用户头像 */}
          {post.avatar_url ? (
            <img 
              src={post.avatar_url} 
              alt={post.author_name}
              className="w-8 h-8 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white/10">
              {post.author_name.charAt(0)}
            </div>
          )}
          
          <div className="font-bold text-white/90">{post.author_name}</div>
          <TypeLabel type={post.type} subject={post.subject} />
          {post.is_featured && (
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
              精选
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {/* 简单处理，实际应用需确保时区正确 */}
          {new Date(post.created_at).toLocaleDateString()}
        </div>
      </div>
      
      <p className="text-gray-200 mb-4 whitespace-pre-wrap leading-relaxed text-[15px]">
        {post.content}
      </p>
      
      {post.image_url && (
        <div className="mb-4 rounded-lg overflow-hidden border border-white/5">
          <img src={post.image_url} alt="Post content" className="w-full max-h-64 object-cover" />
        </div>
      )}
      
      <div className="flex items-center gap-6 text-gray-400 text-sm">
        <button 
          onClick={() => onLike?.(post.id)}
          className="flex items-center gap-1.5 hover:text-red-400 transition-colors group"
        >
          <Heart size={18} className={clsx("transition-transform group-active:scale-125", post.likes > 0 && "fill-red-900/30 text-red-400")} />
          <span>{post.likes || '赞'}</span>
        </button>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className={clsx(
            "flex items-center gap-1.5 transition-colors",
            showComments ? "text-blue-400" : "hover:text-blue-400"
          )}
        >
          <MessageCircle size={18} />
          <span>回复{post.comment_count ? ` (${post.comment_count})` : ''}</span>
        </button>
        
        <button 
          onClick={handleShare}
          className={clsx(
            "flex items-center gap-1.5 transition-colors",
            shareSuccess ? "text-green-400" : "hover:text-green-400"
          )}
        >
          {shareSuccess ? <Check size={18} /> : <Share2 size={18} />}
          <span>{shareSuccess ? '已复制' : '分享'}</span>
        </button>

        <button
          onClick={handleReport}
          className="flex items-center gap-1.5 hover:text-yellow-400 transition-colors ml-auto"
          title="举报"
        >
          <Flag size={16} />
        </button>

        {/* 删除按钮（只有作者可见） */}
        {isOwnPost && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 hover:text-red-400 transition-colors"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* 评论区 */}
      <CommentSection postId={post.id} isOpen={showComments} />
    </div>
  )
}
