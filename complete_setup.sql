-- ================================================
-- 完整数据库设置 + 管理员创建
-- 一键执行，完成所有配置
-- ================================================

-- ================================================
-- 第一部分：创建所有表
-- ================================================

-- 1. 用户资料表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 用户偏好表
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 发帖次数限制表
CREATE TABLE IF NOT EXISTS daily_post_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_date DATE DEFAULT CURRENT_DATE NOT NULL,
  post_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_date)
);

-- 4. 管理员表
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 第二部分：启用 RLS
-- ================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_post_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 第三部分：创建 RLS 策略
-- ================================================

-- user_profiles 策略
DROP POLICY IF EXISTS "用户信息公开可读" ON user_profiles;
CREATE POLICY "用户信息公开可读" ON user_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "用户只能更新自己的信息" ON user_profiles;
CREATE POLICY "用户只能更新自己的信息" ON user_profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "用户只能插入自己的信息" ON user_profiles;
CREATE POLICY "用户只能插入自己的信息" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_preferences 策略
DROP POLICY IF EXISTS "用户可以查看自己的偏好" ON user_preferences;
CREATE POLICY "用户可以查看自己的偏好" ON user_preferences FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以插入自己的偏好" ON user_preferences;
CREATE POLICY "用户可以插入自己的偏好" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以更新自己的偏好" ON user_preferences;
CREATE POLICY "用户可以更新自己的偏好" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- daily_post_limits 策略
DROP POLICY IF EXISTS "用户可以查看自己的发帖记录" ON daily_post_limits;
CREATE POLICY "用户可以查看自己的发帖记录" ON daily_post_limits FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以插入自己的发帖记录" ON daily_post_limits;
CREATE POLICY "用户可以插入自己的发帖记录" ON daily_post_limits FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用户可以更新自己的发帖记录" ON daily_post_limits;
CREATE POLICY "用户可以更新自己的发帖记录" ON daily_post_limits FOR UPDATE USING (auth.uid() = user_id);

-- admin_users 策略
DROP POLICY IF EXISTS "管理员可以查看管理员列表" ON admin_users;
CREATE POLICY "管理员可以查看管理员列表" ON admin_users FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- system_settings 策略
DROP POLICY IF EXISTS "所有人可以读取系统设置" ON system_settings;
CREATE POLICY "所有人可以读取系统设置" ON system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "管理员可以修改系统设置" ON system_settings;
CREATE POLICY "管理员可以修改系统设置" ON system_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- ================================================
-- 第四部分：创建 RPC 函数
-- ================================================

-- 检查今日发帖次数是否超限
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

-- 增加今日发帖次数
CREATE OR REPLACE FUNCTION increment_daily_post_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_post_limits (user_id, post_date, post_count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, post_date)
  DO UPDATE SET post_count = daily_post_limits.post_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 获取今日发帖次数
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

-- 检查是否是管理员
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 第五部分：创建触发器
-- ================================================

-- 自动创建用户资料
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, nickname, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'nickname', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 自动创建用户偏好
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

-- ================================================
-- 第六部分：更新现有表结构
-- ================================================

-- 确保 posts 表有 user_id
ALTER TABLE posts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- 确保 comments 表有 user_id
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- ================================================
-- 第七部分：插入默认配置
-- ================================================

INSERT INTO system_settings (key, value, description)
VALUES 
  ('daily_post_limit', '3', '每日发帖上限'),
  ('enable_registration', 'true', '是否开放注册'),
  ('site_name', '校园论坛', '网站名称'),
  ('site_description', '一个温馨的校园交流平台', '网站描述')
ON CONFLICT (key) DO NOTHING;

-- ================================================
-- 第八部分：添加管理员（需要先注册账号）
-- ================================================

-- 执行此部分前，请先在网站上注册账号：
-- 1. 访问 /register
-- 2. 注册信息：
--    - 邮箱: alandeng@example.com (或你的邮箱)
--    - 用户名: AlanDeng
--    - 昵称: Alan Deng
--    - 密码: dwb918112
-- 
-- 然后执行下面的 SQL：

-- INSERT INTO admin_users (user_id, role)
-- SELECT id, 'super_admin'
-- FROM user_profiles
-- WHERE username = 'AlanDeng'
-- ON CONFLICT (user_id) DO NOTHING;

-- ================================================
-- 验证安装
-- ================================================

-- 查看所有表
SELECT 'Tables created:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_profiles',
  'user_preferences', 
  'daily_post_limits',
  'admin_users',
  'system_settings'
)
ORDER BY table_name;

-- 查看所有函数
SELECT 'Functions created:' as status;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
  'check_daily_post_limit',
  'increment_daily_post_count',
  'get_daily_post_count',
  'is_admin',
  'handle_new_user',
  'create_user_preferences'
)
ORDER BY routine_name;

-- 查看系统设置
SELECT 'System settings:' as status;
SELECT * FROM system_settings ORDER BY key;

SELECT '✅ Setup completed successfully!' as status;
SELECT '⚠️ Next step: Register your admin account at /register' as next_action;
SELECT '   Then run: INSERT INTO admin_users (user_id, role) SELECT id, ''super_admin'' FROM user_profiles WHERE username = ''AlanDeng'';' as command;
