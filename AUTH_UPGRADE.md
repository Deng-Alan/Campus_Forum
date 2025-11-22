# 🔐 认证系统升级指南

从 localStorage 升级到 Supabase Auth

## ✅ 已完成

1. ✅ 重写 `useAuth.ts` 使用 Supabase Auth
2. ✅ 创建 SQL 脚本 `supabase_auth_setup.sql`

## 📝 需要手动完成的步骤

### 步骤 1：执行 SQL 脚本

1. 登录 https://supabase.com
2. 选择项目
3. 进入 **SQL Editor**
4. 打开 `supabase_auth_setup.sql` 文件
5. 复制所有SQL并执行
6. 确认创建了 `user_profiles` 表

### 步骤 2：更新注册页面

在 `web/app/register/page.tsx` 第 48 行：

**修改前：**
```typescript
const result = register({ email, username, nickname, password })
if (result.success) {
  alert(result.message)
  router.push('/')
} else {
  alert(result.message)
}
```

**修改后：**
```typescript
const result = await register({ email, username, nickname, password })
if (result.success) {
  alert(result.message)
  router.push('/')
} else {
  alert(result.message)
}
```

并且将 `handleSubmit` 函数改为 async：
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  // ... 其他代码
}
```

### 步骤 3：更新登录页面

在 `web/app/login/page.tsx` 找到 login 调用：

**修改前：**
```typescript
const result = login({ usernameOrEmail, password })
```

**修改后：**
```typescript
const result = await login({ usernameOrEmail, password })
```

并且将 `handleSubmit` 函数改为 async：
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  // ... 其他代码
}
```

### 步骤 4：更新 UserSettings 组件

在 `web/components/UserSettings.tsx` 中：

1. 将所有更新函数调用改为 await：
   - `await updateUsername(newUsername)`
   - `await updateNickname(newNickname)`
   - `await updatePassword(oldPassword, newPassword)`

2. 将处理函数改为 async

### 步骤 5：测试

1. 本地测试注册：
   ```bash
   npm run dev
   ```
   
2. 尝试注册新用户

3. 尝试登录

4. 测试更新用户信息

## ⚠️ 注意事项

1. **邮箱验证**：Supabase默认需要邮箱验证，可以在项目设置中关闭
   - Settings → Auth → Email Auth → Disable email confirmations

2. **旧数据迁移**：localStorage 中的旧用户数据需要重新注册

3. **密码安全**：Supabase 会自动加密密码

4. **登录方式**：当前版本登录只支持邮箱，不支持用户名登录

## 🎯 部署前检查

- [ ] SQL 脚本已执行
- [ ] 注册页面已更新为 async
- [ ] 登录页面已更新为 async
- [ ] UserSettings 已更新为 async
- [ ] 本地测试通过
- [ ] Supabase Auth 邮箱验证已配置

完成后即可重新部署到 Vercel！
