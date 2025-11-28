-- ===================================================
-- 新功能数据库表
-- ===================================================

-- 1. 申诉表
CREATE TABLE IF NOT EXISTS appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL, -- 申诉理由
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_response TEXT, -- 管理员回复
  admin_id UUID REFERENCES auth.users(id), -- 处理的管理员
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 申诉表索引
CREATE INDEX IF NOT EXISTS idx_appeals_post_id ON appeals(post_id);
CREATE INDEX IF NOT EXISTS idx_appeals_user_id ON appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeals(status);

-- 申诉表 RLS
ALTER TABLE appeals ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的申诉
DROP POLICY IF EXISTS "用户可以查看自己的申诉" ON appeals;
CREATE POLICY "用户可以查看自己的申诉" ON appeals
  FOR SELECT USING (auth.uid() = user_id);

-- 用户可以创建申诉
DROP POLICY IF EXISTS "用户可以创建申诉" ON appeals;
CREATE POLICY "用户可以创建申诉" ON appeals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 管理员可以查看所有申诉
DROP POLICY IF EXISTS "管理员可以查看所有申诉" ON appeals;
CREATE POLICY "管理员可以查看所有申诉" ON appeals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 管理员可以更新申诉
DROP POLICY IF EXISTS "管理员可以更新申诉" ON appeals;
CREATE POLICY "管理员可以更新申诉" ON appeals
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- ===================================================

-- 2. 建议反馈表
CREATE TABLE IF NOT EXISTS suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL, -- 建议内容
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'feature', 'bug', 'improvement')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'implemented')),
  admin_response TEXT, -- 管理员回复
  admin_id UUID REFERENCES auth.users(id),
  is_anonymous BOOLEAN DEFAULT false, -- 是否匿名提交
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建议表索引
CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_category ON suggestions(category);

-- 建议表 RLS
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的建议
DROP POLICY IF EXISTS "用户可以查看自己的建议" ON suggestions;
CREATE POLICY "用户可以查看自己的建议" ON suggestions
  FOR SELECT USING (auth.uid() = user_id OR is_anonymous = true);

-- 用户可以创建建议
DROP POLICY IF EXISTS "用户可以创建建议" ON suggestions;
CREATE POLICY "用户可以创建建议" ON suggestions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 管理员可以查看所有建议
DROP POLICY IF EXISTS "管理员可以查看所有建议" ON suggestions;
CREATE POLICY "管理员可以查看所有建议" ON suggestions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 管理员可以更新建议
DROP POLICY IF EXISTS "管理员可以更新建议" ON suggestions;
CREATE POLICY "管理员可以更新建议" ON suggestions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- ===================================================

-- 3. 为帖子表添加引用字段
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS quoted_post_id UUID REFERENCES posts(id) ON DELETE SET NULL;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_posts_quoted_post_id ON posts(quoted_post_id);

-- ===================================================

-- 4. 为帖子表添加状态列（如不存在），并添加说明
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS status TEXT
  DEFAULT 'approved'
  CHECK (status IN ('pending', 'approved', 'rejected', 'removed'));

COMMENT ON COLUMN posts.status IS 'pending: 待审核, approved: 已通过, rejected: 已拒绝, removed: 已下架（被举报）';

-- ===================================================

-- 5. 创建 RPC 函数：提交申诉
CREATE OR REPLACE FUNCTION submit_appeal(
  p_post_id UUID,
  p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appeal_id UUID;
  v_post_user_id UUID;
BEGIN
  -- 检查帖子是否存在并获取作者
  SELECT user_id INTO v_post_user_id
  FROM posts
  WHERE id = p_post_id;

  IF v_post_user_id IS NULL THEN
    RAISE EXCEPTION '帖子不存在';
  END IF;

  -- 检查是否是帖子作者
  IF v_post_user_id != auth.uid() THEN
    RAISE EXCEPTION '只能申诉自己的帖子';
  END IF;

  -- 检查是否已经有待处理的申诉
  IF EXISTS (
    SELECT 1 FROM appeals 
    WHERE post_id = p_post_id 
    AND user_id = auth.uid()
    AND status = 'pending'
  ) THEN
    RAISE EXCEPTION '该帖子已有待处理的申诉';
  END IF;

  -- 创建申诉
  INSERT INTO appeals (post_id, user_id, reason)
  VALUES (p_post_id, auth.uid(), p_reason)
  RETURNING id INTO v_appeal_id;

  RETURN v_appeal_id;
END;
$$;

-- ===================================================

-- 6. 创建 RPC 函数：提交建议
CREATE OR REPLACE FUNCTION submit_suggestion(
  p_content TEXT,
  p_category TEXT DEFAULT 'general',
  p_is_anonymous BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_suggestion_id UUID;
  v_user_id UUID;
BEGIN
  -- 如果是匿名提交，user_id 为 NULL
  IF p_is_anonymous THEN
    v_user_id := NULL;
  ELSE
    v_user_id := auth.uid();
  END IF;

  -- 创建建议
  INSERT INTO suggestions (user_id, content, category, is_anonymous)
  VALUES (v_user_id, p_content, p_category, p_is_anonymous)
  RETURNING id INTO v_suggestion_id;

  RETURN v_suggestion_id;
END;
$$;

-- ===================================================

-- 7. 创建 RPC 函数：处理申诉（管理员）
CREATE OR REPLACE FUNCTION handle_appeal(
  p_appeal_id UUID,
  p_status TEXT, -- 'approved' 或 'rejected'
  p_admin_response TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_post_id UUID;
BEGIN
  -- 检查是否是管理员
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION '只有管理员可以处理申诉';
  END IF;

  -- 更新申诉状态
  UPDATE appeals
  SET 
    status = p_status,
    admin_response = p_admin_response,
    admin_id = auth.uid(),
    updated_at = NOW()
  WHERE id = p_appeal_id
  RETURNING post_id INTO v_post_id;

  IF v_post_id IS NULL THEN
    RAISE EXCEPTION '申诉不存在';
  END IF;

  -- 如果批准，恢复帖子
  IF p_status = 'approved' THEN
    UPDATE posts
    SET status = 'approved'
    WHERE id = v_post_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- ===================================================

-- 8. 创建 RPC 函数：处理建议（管理员）
CREATE OR REPLACE FUNCTION handle_suggestion(
  p_suggestion_id UUID,
  p_status TEXT,
  p_admin_response TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 检查是否是管理员
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION '只有管理员可以处理建议';
  END IF;

  -- 更新建议状态
  UPDATE suggestions
  SET 
    status = p_status,
    admin_response = p_admin_response,
    admin_id = auth.uid(),
    updated_at = NOW()
  WHERE id = p_suggestion_id;

  RETURN TRUE;
END;
$$;

-- ===================================================

-- 验证
SELECT 'Appeals table created' as status;
SELECT 'Suggestions table created' as status;
SELECT 'Posts table updated with quoted_post_id' as status;
SELECT 'RPC functions created' as status;
