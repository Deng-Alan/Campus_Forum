-- ================================================
-- 武冈三中校园论坛 - 审核管理功能（posts.review_status）
-- ================================================
-- 功能：为帖子增加审核状态字段，用于后台审核管理
-- 创建日期：2025-11-22
-- ================================================

-- 1. 在 posts 表中添加审核状态字段
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending';

-- 如果列已经存在，强制将默认值修改为 'pending'
ALTER TABLE public.posts
ALTER COLUMN review_status SET DEFAULT 'pending';

-- 现有历史帖子默认标记为已通过审核
UPDATE public.posts
SET review_status = 'approved';

-- 2. 为审核状态创建索引，便于后台筛选
CREATE INDEX IF NOT EXISTS idx_posts_review_status ON public.posts(review_status);
