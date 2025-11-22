# 🔐 管理员账号设置指南

## 原管理员信息
- **用户名**: AlanDeng
- **密码**: dwb918112

## ✅ 好消息
现在管理员系统**支持用户名或邮箱登录**！你可以继续使用原来的用户名。

---

## 🚀 快速设置步骤

### 方案 A：使用原密码（推荐）

#### 1. 注册管理员账号
访问你的网站：`https://你的域名/register`

填写信息：
- **邮箱**: `alandeng@example.com`（或你的实际邮箱）
- **用户名**: `AlanDeng`
- **昵称**: `Alan Deng`（或任意）
- **密码**: `dwb918112`（保持原密码）

#### 2. 在 Supabase 添加管理员权限

登录 Supabase Dashboard → SQL Editor，执行：

```sql
-- 方法 1：通过邮箱查找
INSERT INTO admin_users (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = 'alandeng@example.com';  -- 替换为你注册时用的邮箱
```

或者

```sql
-- 方法 2：通过用户名查找
INSERT INTO admin_users (user_id, role)
SELECT user_id, 'super_admin'
FROM user_profiles
WHERE username = 'AlanDeng';
```

#### 3. 登录后台
访问：`https://你的域名/admin/login`

**方式 1 - 用户名登录（推荐）**：
- **用户名**: `AlanDeng`
- **密码**: `dwb918112`

**方式 2 - 邮箱登录**：
- **邮箱**: `alandeng@example.com`
- **密码**: `dwb918112`

✅ **完成！两种方式都可以！**

---

### 方案 B：直接在 Supabase 创建

#### 1. Supabase Dashboard 创建用户
1. 进入 **Authentication → Users**
2. 点击 "Invite user"
3. 输入邮箱：`alandeng@example.com`
4. 设置临时密码（之后可以改）
5. 点击 "Invite user"

#### 2. 复制 User ID
在用户列表中找到刚创建的用户，复制 **User ID**（UUID格式）

#### 3. 创建 user_profile
```sql
-- 替换为复制的 User ID
INSERT INTO user_profiles (user_id, username, nickname, email)
VALUES (
  '复制的UUID',
  'AlanDeng',
  'Alan Deng',
  'alandeng@example.com'
);
```

#### 4. 添加管理员权限
```sql
-- 替换为相同的 User ID
INSERT INTO admin_users (user_id, role)
VALUES ('复制的UUID', 'super_admin');
```

#### 5. 登录后台
访问：`/admin/login`，使用邮箱和刚才设置的密码登录。

---

## 🔧 验证管理员设置

### 检查管理员列表
```sql
SELECT 
  u.email,
  up.username,
  up.nickname,
  a.role,
  a.created_at
FROM admin_users a
JOIN auth.users u ON u.id = a.user_id
LEFT JOIN user_profiles up ON up.user_id = a.user_id;
```

应该显示：
```
email                 | username  | nickname  | role        | created_at
----------------------|-----------|-----------|-------------|------------
alandeng@example.com  | AlanDeng  | Alan Deng | super_admin | 2025-xx-xx
```

---

## 📝 后续管理

### 修改管理员密码
登录后，访问用户设置页面即可修改。

### 添加更多管理员
```sql
-- 添加普通管理员
INSERT INTO admin_users (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = '新管理员邮箱';
```

### 删除管理员权限
```sql
DELETE FROM admin_users
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = '要删除的邮箱'
);
```

---

## ⚠️ 安全建议

1. ✅ 使用真实的邮箱（方便密码重置）
2. ✅ 考虑更改密码为更强的密码
3. ✅ 不要将管理员邮箱和密码提交到 Git
4. ✅ 定期检查管理员列表

---

## 🆘 遇到问题？

### 无法登录后台
1. 检查邮箱是否正确
2. 确认已添加到 `admin_users` 表
3. 查看浏览器控制台错误信息

### RPC 函数错误
```sql
-- 测试 is_admin 函数
SELECT is_admin();
```

应该返回 `true`（如果当前登录用户是管理员）

---

**推荐使用方案 A**，简单快速！

---

## 🎉 总结

现在你可以：
- ✅ 使用 **用户名** `AlanDeng` 登录
- ✅ 使用 **邮箱** 登录
- ✅ 保持原密码 `dwb918112`
- ✅ 管理员后台地址：`/admin/login`

**登录示例**：
```
用户名/邮箱: AlanDeng
密码: dwb918112
```

就这么简单！🚀
