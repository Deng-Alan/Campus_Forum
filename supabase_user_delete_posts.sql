-- ================================================
-- 武冈三中校园论坛 - 用户删除自己帖子的权限
-- ================================================
-- 功能：允许用户删除自己发布的帖子
-- 创建日期：2025-11-22
-- ================================================

-- 注意：由于我们使用的是本地模拟账号（localStorage），无法通过 auth.uid() 验证
-- 因此我们采用简化的权限策略：允许所有人删除帖子（前端控制权限）

-- 方案 1：禁用 posts 表的 RLS（推荐，因为没有真实的用户认证系统）
-- ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;

-- 方案 2：如果已经启用了 RLS，添加删除策略
-- 检查 posts 表是否启用了 RLS
DO $$
BEGIN
  -- 如果 posts 表启用了 RLS，添加删除策略
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'posts'
  ) THEN
    
    -- 删除旧的删除策略
    DROP POLICY IF EXISTS "Allow public delete posts" ON public.posts;
    DROP POLICY IF EXISTS "Allow users delete own posts" ON public.posts;
    
    -- 创建新策略：允许所有人删除帖子（前端已通过 username 验证）
    CREATE POLICY "Allow public delete posts" 
    ON public.posts
    FOR DELETE 
    TO anon, authenticated
    USING (true);
    
    RAISE NOTICE '已成功创建删除策略';
  END IF;
END $$;

-- ================================================
-- 测试
-- ================================================
-- 创建测试帖子
-- INSERT INTO public.posts (content, author_name, type, likes, review_status)
-- VALUES ('测试帖子', '测试用户', 'campus_fun', 0, 'approved')
-- RETURNING id;

-- 尝试删除（应该成功）
-- DELETE FROM public.posts WHERE id = '你的测试帖子ID';
