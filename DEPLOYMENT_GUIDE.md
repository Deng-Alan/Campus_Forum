# 武冈三中校园论坛 - 部署指南

## 📋 前置准备

### 1. Supabase 项目配置
确保你已经有：
- ✅ Supabase 项目 URL
- ✅ Supabase Anon Key
- ✅ 数据库访问权限

### 2. 本地环境
- Node.js 18+
- npm 或 yarn

---

## 🚀 第一步：配置环境变量

在 `web` 目录下创建 `.env.local` 文件：

```bash
cd web
```

创建文件并填入以下内容：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**⚠️ 注意**：请将上面的值替换为你的实际 Supabase 配置。

---

## 🗄️ 第二步：运行数据库脚本

登录 [Supabase Dashboard](https://supabase.com/dashboard)，进入你的项目，点击左侧的 **SQL Editor**。

### 脚本运行顺序（重要！）

#### 1️⃣ 创建主表结构和内容过滤
复制 `supabase_schema_v2.sql` 的内容，粘贴到 SQL Editor 中执行。

**作用**：
- 创建 `posts` 表
- 添加内容过滤函数和触发器
- 创建点赞 RPC 函数

#### 1️⃣-B 创建系统设置表（新增）
复制 `supabase_settings.sql` 的内容，粘贴到 SQL Editor 中执行。

**作用**：
- 创建 `system_settings` 表
- 设置每日发帖上限默认值为 3
- 配置读写权限策略

#### 1️⃣-C 创建后端内容过滤函数（新增）
复制 `supabase_content_filter.sql` 的内容，粘贴到 SQL Editor 中执行。

**作用**：
- 创建 `replace_bad_words()` 函数（脏话过滤和友好词替换）
- 创建 `check_sensitive_content()` 函数（敏感内容检测）
- 自动触发器：在发帖时自动执行过滤，敏感内容自动驳回审核

#### 2️⃣ 创建评论表
复制 `supabase_comments.sql` 的内容，粘贴到 SQL Editor 中执行。

**作用**：
- 创建 `comments` 表
- 添加评论内容过滤
- 创建评论点赞 RPC 函数

#### 3️⃣ 配置图片存储（两种方式）

**方式 A：SQL 脚本（推荐）**
复制 `supabase_storage_setup.sql` 的内容，粘贴到 SQL Editor 中执行。

**方式 B：手动配置（如果 SQL 失败）**
1. 在 Supabase Dashboard 点击左侧 **Storage**
2. 点击 **New bucket** 按钮
3. 填写：
   - Name: `images`
   - **勾选** `Public bucket`（重要！）
4. 点击 **Create bucket**
5. 进入 `images` bucket，点击 **Policies** 标签
6. 点击 **New policy** 添加两个策略：

**策略 1：允许公开上传**
```sql
CREATE POLICY "Allow public upload to posts folder"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'images' AND (storage.foldername(name))[1] = 'posts');
```

**策略 2：允许公开读取**
```sql
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');
```

#### 4️⃣ 创建学霸排行榜统计函数
复制 `supabase_leaderboard.sql` 的内容，粘贴到 SQL Editor 中执行。

**作用**：
- 创建 `get_study_leaderboard()` 函数
- 统计学习互助板块贡献
- 计算积分排名

---

## 🔧 第三步：安装依赖并启动

```bash
cd web
npm install
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)

---

## ✅ 第四步：功能测试

### 测试 1：发帖功能
1. 在主页点击"校园趣事"或"学习互助"
2. 输入内容，尝试上传一张图片
3. 点击"发布"
4. ✅ 检查帖子是否成功显示

### 测试 2：内容过滤
1. 尝试发布含有脏话的内容（如"傻×"）
2. ✅ 检查是否被替换为 `***`
3. 尝试发布敏感内容（如"欺凌"）
4. ✅ 检查是否显示红色警告，无法发布

### 测试 3：评论功能
1. 点击任意帖子的"回复"按钮
2. 输入评论内容并发送
3. ✅ 检查评论是否成功显示
4. 尝试给评论点赞
5. ✅ 检查点赞数是否增加

### 测试 4：学霸排行榜
1. 发布几条"学习互助"类型的帖子
2. 回复其他学习互助帖子
3. 刷新页面，查看右侧排行榜
4. ✅ 检查积分是否正确计算

### 测试 5：后台管理
1. 访问 [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. 输入账号 `AlanDeng`，密码 `dwb918112`
3. 尝试删除违规帖子
4. 尝试设置精选帖子
5. ✅ 检查操作是否生效

---

## 🐛 常见问题

### Q1: 提示 "supabaseUrl is required"
**原因**：环境变量未加载

**解决方法**：
1. 确认 `web/.env.local` 文件存在
2. 检查文件名是否正确（不是 `.env` 而是 `.env.local`）
3. 重启开发服务器（`Ctrl+C` 后重新 `npm run dev`）

### Q2: 图片上传失败
**原因**：Storage bucket 未正确配置

**解决方法**：
1. 检查 Supabase Dashboard > Storage 中是否有 `images` bucket
2. 确认 bucket 设置为 `Public`
3. 检查 Policies 是否正确添加
4. 查看浏览器控制台错误信息

### Q3: 排行榜显示"暂无数据"
**原因**：没有学习互助类型的数据

**解决方法**：
1. 发布几条"学习互助"类型的帖子
2. 回复这些帖子
3. 刷新页面
4. 如果仍然无数据，检查 SQL 函数是否成功创建：
```sql
SELECT * FROM get_study_leaderboard(7);
```

### Q4: 内容过滤不生效
**原因**：触发器未创建成功

**解决方法**：
1. 在 Supabase SQL Editor 中运行：
```sql
SELECT * FROM information_schema.triggers WHERE trigger_name = 'filter_post_content';
```
2. 如果无结果，重新运行 `supabase_schema_v2.sql`

---

## 📦 部署到 Vercel

### 1. 推送代码到 GitHub
```bash
git init
git add .
git commit -m "Initial commit: 武冈三中校园论坛"
git remote add origin your-github-repo-url
git push -u origin main
```

### 2. 在 Vercel 中导入项目
1. 访问 [vercel.com](https://vercel.com)
2. 点击 **New Project**
3. 导入你的 GitHub 仓库
4. 设置 Root Directory 为 `web`
5. 添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. 点击 **Deploy**

### 3. 配置自定义域名（可选）
在 Vercel 项目设置中添加你的域名。

---

## 🎉 完成！

如果一切顺利，你的校园论坛已经成功部署！

**下一步建议**：
- 📝 完善用户系统（学号绑定）
- 🔗 添加分享功能
- 📊 优化排行榜（定时刷新）
- 🎨 根据学校特色定制 UI

如有问题，请检查：
1. 浏览器控制台（F12）的错误信息
2. Supabase 项目的 Logs 页面
3. Vercel 部署日志

---

**祝你的校园论坛运营顺利！🚀**
