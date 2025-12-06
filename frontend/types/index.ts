export type PostType = 'campus_fun' | 'study_help' | 'anonymous' | 'confession';

export interface Post {
  id: string
  content: string
  author_name: string
  created_at: string
  likes: number
  // 新增字段
  type: PostType
  student_id?: string // 匿名存储，用于防刷屏
  image_url?: string
  avatar_url?: string // 用户头像
  subject?: string // 用于学习互助
  is_best_answer?: boolean
  is_featured?: boolean // 用于表白墙精选
  review_status?: 'pending' | 'approved' | 'rejected' // 审核状态
  comment_count?: number // 评论数量（可选，前端计算）
  quoted_post_id?: string // 引用的帖子ID
  quoted_post?: {
    id: string
    content: string
    author_name: string
  } // 引用的帖子（精简信息）
  status?: 'pending' | 'approved' | 'rejected' | 'removed' // 帖子状态
}

export interface CreatePostDTO {
  content: string
  author_name: string
  type: PostType
  image_url?: string
  subject?: string
  quoted_post_id?: string // 可选：引用的帖子ID
}

export interface Comment {
  id: string
  post_id: string
  content: string
  author_name: string
  created_at: string
  likes: number
}

export interface CreateCommentDTO {
  post_id: string
  content: string
  author_name: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  is_top: boolean
  type: 'notice' | 'activity' | 'urgent'
  created_at: string
}

export interface Report {
  id: string
  post_id: string
  reason: string
  status: 'pending' | 'resolved' | 'ignored'
  created_at: string
  // 关联查询时可能用到
  posts?: Post
}

// 申诉类型
export interface Appeal {
  id: string
  post_id: string
  user_id: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  admin_response?: string
  admin_id?: string
  created_at: string
  updated_at: string
  // 关联查询
  posts?: Post
}

export interface CreateAppealDTO {
  post_id: string
  reason: string
}

// 建议类型
export type SuggestionCategory = 'general' | 'feature' | 'bug' | 'improvement'
export type SuggestionStatus = 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'implemented'

export interface Suggestion {
  id: string
  user_id?: string
  content: string
  category: SuggestionCategory
  status: SuggestionStatus
  admin_response?: string
  admin_id?: string
  is_anonymous: boolean
  created_at: string
  updated_at: string
}

export interface CreateSuggestionDTO {
  content: string
  category?: SuggestionCategory
  is_anonymous?: boolean
}

