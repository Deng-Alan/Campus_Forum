-- ================================================
-- 创建管理员账号 AlanDeng
-- 执行此脚本前，请先完成用户注册
-- ================================================

-- 方法 1：如果你已经注册了账号（推荐）
-- 只需执行下面这一句，将注册的账号设为管理员

INSERT INTO admin_users (user_id, role)
SELECT id, 'super_admin'
FROM user_profiles
WHERE username = 'AlanDeng'
ON CONFLICT (user_id) DO NOTHING;

-- 验证是否添加成功
SELECT 
  up.username,
  up.email,
  au.role,
  au.created_at
FROM admin_users au
JOIN user_profiles up ON up.id = au.user_id
WHERE up.username = 'AlanDeng';

-- ================================================
-- 方法 2：完整创建（如果还没注册）
-- 需要使用 Supabase 的内置函数
-- ================================================

-- 注意：下面的方法需要你先在网站上注册账号
-- 因为 Supabase Auth 的密码加密比较复杂
-- 
-- 步骤：
-- 1. 访问 /register 注册账号
--    - 邮箱: alandeng@example.com (或你的真实邮箱)
--    - 用户名: AlanDeng
--    - 昵称: Alan Deng
--    - 密码: dwb918112
--
-- 2. 然后执行上面的 "方法 1" 即可

-- ================================================
-- 辅助查询：查看所有管理员
-- ================================================

SELECT 
  u.email,
  up.username,
  up.nickname,
  au.role,
  au.created_at
FROM admin_users au
JOIN auth.users u ON u.id = au.user_id
LEFT JOIN user_profiles up ON up.id = au.user_id
ORDER BY au.created_at DESC;

-- ================================================
-- 辅助查询：查看所有用户
-- ================================================

SELECT 
  up.username,
  up.email,
  up.nickname,
  up.created_at,
  CASE 
    WHEN EXISTS (SELECT 1 FROM admin_users WHERE user_id = up.id) 
    THEN '是' 
    ELSE '否' 
  END as 是否管理员
FROM user_profiles up
ORDER BY up.created_at DESC;

-- ================================================
-- 删除管理员权限（如果需要）
-- ================================================

-- DELETE FROM admin_users
-- WHERE user_id = (
--   SELECT id FROM user_profiles WHERE username = 'AlanDeng'
-- );
