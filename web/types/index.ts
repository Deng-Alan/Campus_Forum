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
  subject?: string // 用于学习互助
  is_best_answer?: boolean
  is_featured?: boolean // 用于表白墙精选
  comment_count?: number // 评论数量（可选，前端计算）
}

export interface CreatePostDTO {
  content: string
  author_name: string
  type: PostType
  image_url?: string
  subject?: string
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
