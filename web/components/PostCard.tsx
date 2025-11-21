import { Post, PostType } from '@/types'
import { Heart, Share2, MessageCircle, BookOpen, Laugh, GraduationCap, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import clsx from 'clsx'
import { useState } from 'react'
import { CommentSection } from './CommentSection'
import { sharePost } from '@/lib/share-utils'

interface PostCardProps {
  post: Post
  onLike?: (id: string) => void
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

export function PostCard({ post, onLike }: PostCardProps) {
  const isConfession = post.type === 'confession';
  const [showComments, setShowComments] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = async () => {
    const result = await sharePost(post.id, post.content, post.type)
    if (result.success) {
      setShareSuccess(true)
      setTimeout(() => setShareSuccess(false), 2000)
    } else {
      alert(result.message)
    }
  };
  
  return (
    <div className={clsx(
      "p-4 border rounded-lg mb-4 transition-all hover:border-opacity-50",
      isConfession 
        ? "bg-gradient-to-br from-neutral-900 to-pink-900/10 border-pink-500/20" 
        : "bg-neutral-900 border-white/10"
    )}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
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
      </div>

      {/* 评论区 */}
      <CommentSection postId={post.id} isOpen={showComments} />
    </div>
  )
}
