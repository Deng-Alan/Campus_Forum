-- ================================================
-- 添加管理员账号 - 正确版本
-- ================================================

-- ✅ 第一步：先在网站注册账号 /register
--    邮箱: alandeng@example.com (或你的邮箱)
--    用户名: AlanDeng
--    昵称: Alan Deng  
--    密码: dwb918112

-- ✅ 第二步：执行下面的 SQL（粘贴到 Supabase SQL Editor）

INSERT INTO admin_users (user_id, role)
SELECT id, 'super_admin'
FROM user_profiles
WHERE username = 'AlanDeng'
ON CONFLICT (user_id) DO NOTHING;

-- ✅ 第三步：验证是否成功

SELECT 
  up.username,
  up.email,
  au.role,
  au.created_at as 成为管理员时间
FROM admin_users au
JOIN user_profiles up ON up.id = au.user_id
WHERE up.username = 'AlanDeng';

-- ================================================
-- 如果显示一行数据，说明成功！
-- 现在可以访问 /admin/login 登录
-- 
-- 用户名: AlanDeng
-- 密码: dwb918112
-- ================================================
