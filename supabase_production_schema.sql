-- ================================
-- 完整生产环境数据库架构
-- ================================

-- 1. 用户偏好设置表
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和修改自己的偏好
CREATE POLICY "用户可以查看自己的偏好" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的偏好" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的偏好" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. 发帖次数限制表
CREATE TABLE IF NOT EXISTS daily_post_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_date DATE DEFAULT CURRENT_DATE NOT NULL,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_date)
);

-- 启用 RLS
ALTER TABLE daily_post_limits ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的发帖记录
CREATE POLICY "用户可以查看自己的发帖记录" ON daily_post_limits
  FOR SELECT USING (auth.uid() = user_id);

-- 用户可以插入和更新自己的发帖记录
CREATE POLICY "用户可以插入自己的发帖记录" ON daily_post_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的发帖记录" ON daily_post_limits
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. 管理员角色表
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 只有管理员可以查看管理员列表
CREATE POLICY "管理员可以查看管理员列表" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- 4. 更新 posts 表，确保有 user_id
ALTER TABLE posts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- 5. 更新 comments 表，确保有 user_id  
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- 6. 创建函数：检查用户今日发帖次数
CREATE OR REPLACE FUNCTION check_daily_post_limit(p_user_id UUID, p_limit INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  today_count INTEGER;
BEGIN
  SELECT COALESCE(post_count, 0) INTO today_count
  FROM daily_post_limits
  WHERE user_id = p_user_id AND post_date = CURRENT_DATE;
  
  RETURN COALESCE(today_count, 0) < p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 创建函数：增加今日发帖次数
CREATE OR REPLACE FUNCTION increment_daily_post_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_post_limits (user_id, post_date, post_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, post_date)
  DO UPDATE SET post_count = daily_post_limits.post_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 创建函数：获取今日发帖次数
CREATE OR REPLACE FUNCTION get_daily_post_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  today_count INTEGER;
BEGIN
  SELECT COALESCE(post_count, 0) INTO today_count
  FROM daily_post_limits
  WHERE user_id = p_user_id AND post_date = CURRENT_DATE;
  
  RETURN COALESCE(today_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 创建视图：用户统计
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  COUNT(DISTINCT id) as total_users,
  COUNT(DISTINCT CASE WHEN created_at >= CURRENT_DATE THEN id END) as new_users_today
FROM auth.users;

-- 10. 设置系统配置表
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认配置
INSERT INTO system_settings (key, value, description)
VALUES 
  ('daily_post_limit', '3', '每日发帖上限'),
  ('enable_registration', 'true', '是否开放注册')
ON CONFLICT (key) DO NOTHING;

-- 启用 RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取系统设置
CREATE POLICY "所有人可以读取系统设置" ON system_settings
  FOR SELECT USING (true);

-- 只有管理员可以修改系统设置
CREATE POLICY "管理员可以修改系统设置" ON system_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid()
    )
  );

-- 11. 创建触发器：自动创建用户偏好
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_preferences ON auth.users;
CREATE TRIGGER on_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_preferences();

-- 12. 创建 RPC 函数：检查是否是管理员
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 完成
SELECT 'Schema migration completed successfully!' as status;
