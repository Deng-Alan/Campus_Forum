# 🚀 Vercel 部署指南

## 📋 部署前准备

### 1. 确保代码已提交到 Git

```bash
# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Ready for deployment"
```

### 2. 推送到 GitHub（推荐）

```bash
# 在 GitHub 创建新仓库后
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

## 🌐 部署到 Vercel

### 方法一：通过 Vercel 网站（推荐）

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的 GitHub 仓库
   - 选择 `frontend` 目录作为根目录

3. **配置环境变量**
   点击 "Environment Variables"，添加：
   ```
   NEXT_PUBLIC_API_BASE_URL = https://你的后端域名/api/v1
   NEXT_PUBLIC_SITE_URL = https://你的项目名.vercel.app
   ```

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成（约 2-3 分钟）
   - 部署成功后会得到一个 URL：`https://你的项目名.vercel.app`

### 方法二：通过 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   cd web
   vercel
   ```

4. **按提示配置**
   - 选择或创建项目
   - 确认配置
   - 等待部署完成

## ⚙️ 自动部署配置

部署后，每次推送到 main 分支都会自动重新部署：

```bash
git add .
git commit -m "更新内容"
git push origin main
```

## 🔧 部署后配置

### 1. 配置自定义域名（可选）

在 Vercel 项目设置中：
- Settings → Domains
- 添加你的域名
- 按照提示配置 DNS

### 2. 配置后端 CORS（可选）

如果后端与前端是不同域名部署，请确保后端已允许来自前端域名的跨域请求。

### 3. 更新管理员配置

如果需要，修改默认管理员账号（见 `init_database.sql`）并在上线后尽快更改密码。

## 🐛 常见问题

### 构建失败

1. **检查环境变量**
   - 确保在 Vercel 中正确配置了所有环境变量
   - 变量名必须完全匹配

2. **检查依赖**
   ```bash
   npm install
   npm run build
   ```

3. **查看构建日志**
   - 在 Vercel 项目页面查看详细日志

### 运行时错误

1. **检查后端 API 连接**
   - 确认 `NEXT_PUBLIC_API_BASE_URL` 指向可访问的后端地址（例如 `https://api.example.com/api/v1`）
   - 如果跨域失败，检查后端 CORS 配置

2. **检查浏览器控制台**
   - F12 打开开发者工具
   - 查看错误信息

## 📊 性能优化建议

1. **启用 Edge Functions**（已配置）
   - 区域：新加坡 (sin1)
   - 更快的响应速度

2. **图片优化**
   - 使用 Next.js Image 组件
   - 自动优化和压缩

3. **缓存配置**
   - Vercel 自动处理缓存
   - 静态资源 CDN 加速

## 🎉 部署完成！

访问你的网站：
- 生产环境：https://你的项目名.vercel.app
- 预览环境：每个 PR 都会生成预览 URL

---

**需要帮助？**
- Vercel 文档：https://vercel.com/docs
- Next.js 文档：https://nextjs.org/docs
