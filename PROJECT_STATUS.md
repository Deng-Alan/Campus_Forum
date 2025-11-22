# 武冈三中校园论坛 - 开发进度

## 已完成功能 ✅

### 1. 基础架构
- [x] Next.js 15 + TypeScript + Tailwind CSS 项目初始化
- [x] Supabase 数据库连接配置
- [x] 环境变量管理（`.env.local`）
- [x] 全局主题样式（护眼深灰 `#121212` + 青春蓝 `#0066CC`）

### 2. 论坛核心功能
- [x] **发帖功能**
  - 支持 4 种板块：校园趣事、学习互助、表白墙、匿名树洞
  - 学科选择（数学、物理、化学等）
  - **图片上传功能** ✨新增（Supabase Storage 集成）
  - 实时内容过滤提示
- [x] **帖子列表**
  - 按发布时间倒序排列
  - 精选帖子置顶
  - 不同板块显示不同颜色标签
- [x] **点赞功能**
  - 乐观更新 UI
  - Supabase RPC 函数实现
- [x] **评论/回复系统**
  - 评论列表展示
  - 发表评论（含内容过滤）
  - 评论点赞
  - 折叠/展开评论区

### 3. 内容安全过滤（三重防护）
- [x] **前端实时过滤**（`lib/content-filter.ts`）
  - 脏话替换为 `***`
  - 友好词转换（如"约会"→"一起吃食堂"）
  - 敏感内容检测（家庭暴力、校园欺凌等）
- [x] **后端触发器过滤**（Supabase）
  - 数据库层面自动清洗内容
  - 极端敏感内容直接拒绝插入
- [x] **防刷屏限制**
  - 前端 LocalStorage 限制发帖频率（1分钟/次）

### 4. 后台管理系统
- [x] 管理员登录（账号：`AlanDeng`，密码：`dwb918112`）
- [x] 帖子管理表格
  - 查看帖子类型、内容、作者、时间
  - 删除违规帖子
  - 设置/取消精选置顶 ⭐
- [x] Cookie 会话管理

### 5. 学霸排行榜 ✨新增
- [x] 真实数据统计（基于学习互助板块）
- [x] 动态积分计算（发题 +2分，答题 +1分，获赞 +0.5分）
- [x] 时间筛选（本周/本月/全年）
- [x] Supabase RPC 函数实现

### 6. UI/UX 增强
- [x] 双栏布局（帖子流 + 侧边栏）
- [x] 顶部导航栏（固定吸顶）
- [x] 学霸排行榜组件（真实数据）
- [x] 校园公告卡片
- [x] 表白墙特殊粉色渐变样式
- [x] **图片预览和删除**

### 7. 分享功能 ✨新增
- [x] 一键复制帖子链接
- [x] 自动生成分享文案
- [x] 复制成功视觉反馈

### 8. 用户系统（简易版）✨新增
- [x] 昵称设置和修改
- [x] 本地存储用户信息
- [x] 发帖和评论自动使用昵称
- [x] 匿名模式保护（表白墙/匿名树洞）
- [x] 昵称验证（长度、敏感词过滤）

---

### 9. 后台管理系统增强 ✨新增
- [x] 多模块管理（帖子/公告/举报）
- [x] 动态公告发布与管理
- [x] 举报处理流程（忽略/删除帖子）

### 10. 其他优化
- [x] 首页动态公告展示
- [x] 帖子举报功能

---

## 待完善功能 🚧

### 优先级 P2（增强功能）
- [ ] 帖子搜索
- [ ] 积分系统
- [ ] 消息通知（有人回复时提醒）

---

## 数据库表结构

### `posts` 表（帖子）
```sql
id: uuid (主键)
content: text
author_name: text
type: text (类型)
subject: text (学科，可选)
image_url: text (图片，可选)
student_id: text (学号，可选)
is_featured: boolean (是否精选)
is_best_answer: boolean (是否最佳答案)
likes: integer (点赞数)
created_at: timestamp
```

### `comments` 表（评论）✨新增
```sql
id: uuid (主键)
post_id: uuid (外键 -> posts.id)
content: text
author_name: text
likes: integer
created_at: timestamp
```

---

## 如何运行项目

### 1. 安装依赖
```bash
cd web
npm install
```

### 2. 配置环境变量
在 `web/.env.local` 中填入你的 Supabase 配置：
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 运行数据库脚本
在 Supabase SQL Editor 中依次运行：
1. `supabase_schema_v2.sql` - 主表结构 + 内容过滤
2. `supabase_comments.sql` - 评论表 + 评论过滤
3. `supabase_storage_setup.sql` - 图片存储桶配置 ✨
4. `supabase_leaderboard.sql` - 学霸排行榜统计函数 ✨

**Storage 配置替代方案**（如果 SQL 执行失败）：
- 进入 Supabase Dashboard > Storage
- 点击 "New bucket"，名称填 `images`，勾选 `Public bucket`
- 保存后在 Policies 中手动添加以下策略：
  - 允许公开上传到 posts 文件夹
  - 允许公开读取所有图片

### 4. 启动开发服务器
```bash
npm run dev
```
访问 `http://localhost:3000`

### 5. 访问后台管理
访问 `http://localhost:3000/admin/login`
- 账号：`AlanDeng`
- 密码：`dwb918112`

---

## 技术栈

- **前端**: Next.js 15, React 19, TypeScript
- **样式**: Tailwind CSS
- **UI 组件**: Lucide Icons
- **后端**: Supabase (PostgreSQL + Auth + Storage)
- **部署**: Vercel (推荐)

---

## 下一步计划

**必须先完成的配置**（功能才能正常工作）：
1. ⚠️ 运行 `supabase_storage_setup.sql` 或手动配置 Storage bucket
2. ⚠️ 运行 `supabase_leaderboard.sql` 创建排行榜统计函数

**可选扩展功能**：
1. 实现发帖历史页面
2. 添加板块筛选功能
3. 开发举报系统

---

最后更新：2025-11-21
