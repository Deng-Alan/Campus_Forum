-- ================================================
-- 修复注册问题 - 执行此脚本
-- ================================================

-- 1. 确保 user_profiles 表存在
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 启用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. 删除旧策略
DROP POLICY IF EXISTS "用户信息公开可读" ON user_profiles;
DROP POLICY IF EXISTS "用户只能更新自己的信息" ON user_profiles;
DROP POLICY IF EXISTS "用户只能插入自己的信息" ON user_profiles;
DROP POLICY IF EXISTS "允许触发器插入" ON user_profiles;
DROP POLICY IF EXISTS "允许服务角色插入" ON user_profiles;

-- 4. 创建新的 RLS 策略
-- 允许所有人读取基本信息（用户名、昵称、头像）
CREATE POLICY "用户信息公开可读" ON user_profiles
  FOR SELECT USING (true);

-- 用户只能更新自己的信息
CREATE POLICY "用户只能更新自己的信息" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 允许服务角色（触发器）插入
CREATE POLICY "允许服务角色插入" ON user_profiles
  FOR INSERT WITH CHECK (true);

-- 5. 创建或更新触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, nickname, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不阻止用户创建
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 重新创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 7. 验证配置
DO $$
BEGIN
  -- 检查触发器
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✅ Trigger created successfully';
  ELSE
    RAISE NOTICE '❌ Trigger not found';
  END IF;

  -- 检查 RLS 策略
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_profiles' 
    AND policyname = '允许服务角色插入'
  ) THEN
    RAISE NOTICE '✅ RLS policy created successfully';
  ELSE
    RAISE NOTICE '❌ RLS policy not found';
  END IF;
END $$;

-- 8. 测试查询（确保可以读取）
SELECT 'Test: Can read user_profiles' as test;
SELECT COUNT(*) as user_count FROM user_profiles;

SELECT '✅ Registration fix completed!' as status;
SELECT '📝 Now you can register at /register' as next_step;
