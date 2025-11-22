# ✅ SQL 错误已修复

## 🐛 错误原因

之前的 SQL 脚本中，`user_profiles` 表有重复的列定义：
- `id` (主键)
- `user_id` (重复)

查询时使用了 `SELECT user_id`，但应该使用 `SELECT id`。

---

## ✅ 已修复的文件

| 文件 | 修复内容 |
|------|----------|
| `supabase_auth_setup.sql` | ✅ 移除重复的 user_id 列 |
| `complete_setup.sql` | ✅ 修复表结构和触发器 |
| `create_admin_user.sql` | ✅ 所有查询改用 id |
| `添加管理员.sql` | ✅ 新建简化版本 |
| `web/hooks/useAuth.ts` | ✅ 注册时不插入 user_id |

---

## 🚀 现在可以正确执行

### 方法 1：使用完整脚本（推荐）

**复制并执行** `complete_setup.sql`

这会创建所有表、函数、触发器。

### 方法 2：分步执行

1. **执行** `supabase_auth_setup.sql`
2. **执行** `supabase_production_schema.sql`

---

## 📝 添加管理员的正确命令

### 步骤 1：注册账号
访问 `/register`
```
邮箱: alandeng@example.com
用户名: AlanDeng
昵称: Alan Deng
密码: dwb918112
```

### 步骤 2：添加管理员权限
在 Supabase SQL Editor 执行：

```sql
INSERT INTO admin_users (user_id, role)
SELECT id, 'super_admin'
FROM user_profiles
WHERE username = 'AlanDeng';
```

✅ **注意**：使用 `SELECT id`，不是 `SELECT user_id`

### 步骤 3：验证成功
```sql
SELECT 
  up.username,
  up.email,
  au.role
FROM admin_users au
JOIN user_profiles up ON up.id = au.user_id
WHERE up.username = 'AlanDeng';
```

如果显示一行数据，说明成功！

---

## 🎯 快速使用脚本

**最简单的方法** - 使用 `添加管理员.sql`：
1. 打开文件
2. 复制全部内容
3. 粘贴到 Supabase SQL Editor
4. 执行

---

## ⚠️ 如果之前执行过错误的脚本

### 删除旧的表重新创建
```sql
-- 删除旧表（谨慎！会丢失数据）
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS daily_post_limits CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 然后重新执行 complete_setup.sql
```

或者

### 修复现有表
```sql
-- 如果 user_profiles 表有 user_id 列，删除它
ALTER TABLE user_profiles DROP COLUMN IF EXISTS user_id;
```

---

## ✨ 现在部署清单

- [x] SQL 脚本已修复
- [x] 前端代码已修复
- [ ] 执行 SQL 创建表
- [ ] 注册管理员账号
- [ ] 添加管理员权限
- [ ] 测试登录

---

**现在可以正确执行了！直接用 `complete_setup.sql` 或 `添加管理员.sql`** 🎉
