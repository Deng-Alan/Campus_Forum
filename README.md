# 武冈三中校园论坛

> 一个专为初中生设计的安全、友好的校园社区平台

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 项目简介

武冈三中校园论坛是一个为初中生量身打造的校园社交平台，旨在为学生提供一个安全、积极、有趣的交流空间。

### 🎯 核心价值

- **🛡️ 安全第一**：三重内容过滤机制，保护青少年健康成长
- **📚 学习互助**：学霸排行榜激励，互帮互助提升成绩
- **🎨 青春活力**：护眼深色主题 + 青春蓝配色
- **💬 畅所欲言**：四大特色板块满足不同需求

---

## ✨ 核心功能

### 1. 四大特色板块

#### 🎉 校园趣事
分享食堂新菜、操场见闻、班级趣事

#### 📝 学习互助
数理化生问题求助，学霸答疑解惑

#### 💝 表白墙
感谢同桌、祝福老师、正能量表白

#### 🤐 匿名树洞
吐槽作业、分享小秘密（匿名保护）

---

### 2. 三重内容安全防护

```
┌─────────────────────────────────────────┐
│  前端实时过滤                            │
│  - 脏话替换为 ***                        │
│  - 友好词转换（如"约会"→"一起吃食堂"）   │
│  - 实时提示敏感内容                      │
└─────────────────────────────────────────┘
              ⬇
┌─────────────────────────────────────────┐
│  后端触发器过滤                          │
│  - 数据库层自动清洗                      │
│  - 极端内容直接拒绝插入                  │
└─────────────────────────────────────────┘
              ⬇
┌─────────────────────────────────────────┐
│  防刷屏限制                              │
│  - 1分钟最多发布1条帖子                  │
│  - LocalStorage + 时间戳验证             │
└─────────────────────────────────────────┘
```

---

### 3. 学霸排行榜 🏆

**积分规则**：
- 发布学习互助帖子：+2 分
- 回复学习互助帖子：+1 分
- 获得点赞：+0.5 分

**时间维度**：本周 / 本月 / 全年

---

### 4. 简易用户系统

- ✅ 自定义昵称（最长 20 字符）
- ✅ 昵称验证（敏感词过滤）
- ✅ 本地存储（无需注册）
- ✅ 智能匿名（表白墙/树洞自动匿名）

---

### 5. 图片上传

- ✅ 本地图片直接上传
- ✅ 实时预览 + 一键删除
- ✅ 支持 JPG/PNG/GIF，最大 5MB
- ✅ Supabase Storage 云存储

---

### 6. 一键分享

点击"分享"按钮，自动复制：
```
【校园趣事】今天食堂的红烧肉超好吃！... - 来自武冈三中校园论坛

http://localhost:3000/post/xxx
```

---

## 🚀 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn
- Supabase 账号（免费）

### 安装步骤

#### 1. 克隆项目
```bash
git clone https://github.com/your-username/Campus_Forum.git
cd Campus_Forum
```

#### 2. 安装依赖
```bash
cd web
npm install
```

#### 3. 配置环境变量
创建 `web/.env.local` 文件：
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### 4. 运行数据库脚本
在 [Supabase Dashboard](https://supabase.com/dashboard) 的 SQL Editor 中依次运行：
1. `supabase_schema_v2.sql`
2. `supabase_comments.sql`
3. `supabase_storage_setup.sql`
4. `supabase_leaderboard.sql`

#### 5. 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 📂 项目结构

```
Campus_Forum/
├── web/                          # Next.js 前端项目
│   ├── app/                      # App Router 页面
│   │   ├── page.tsx             # 首页
│   │   └── admin/               # 后台管理
│   ├── components/               # React 组件
│   │   ├── PostCard.tsx         # 帖子卡片
│   │   ├── CreatePost.tsx       # 发帖组件
│   │   ├── CommentSection.tsx   # 评论区
│   │   ├── Leaderboard.tsx      # 排行榜
│   │   ├── UserSettings.tsx     # 用户设置
│   │   └── ImageUpload.tsx      # 图片上传
│   ├── hooks/                    # 自定义 Hooks
│   │   └── useUser.ts           # 用户管理
│   ├── lib/                      # 工具函数
│   │   ├── supabase.ts          # Supabase 客户端
│   │   ├── content-filter.ts    # 内容过滤
│   │   └── share-utils.ts       # 分享工具
│   └── types/                    # TypeScript 类型定义
├── supabase_*.sql                # 数据库脚本
├── PROJECT_STATUS.md             # 项目状态
├── DEPLOYMENT_GUIDE.md           # 部署指南
├── TESTING_CHECKLIST.md          # 测试清单
├── CHANGELOG.md                  # 更新日志
└── README.md                     # 项目说明
```

---

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide Icons
- **日期**: date-fns

### 后端
- **数据库**: Supabase (PostgreSQL)
- **存储**: Supabase Storage
- **实时**: Supabase Realtime (可选)

### 部署
- **推荐**: Vercel
- **备选**: Netlify / Railway

---

## 👥 用户角色

### 学生（普通用户）
- 浏览所有帖子
- 发布帖子（4 个板块）
- 回复和点赞
- 设置昵称
- 分享内容

### 管理员
- **账号**: `AlanDeng`
- **密码**: `dwb918112`
- **权限**:
  - 删除违规帖子
  - 设置精选帖子
  - 查看所有内容

---

## 🔒 安全特性

### 内容安全
- ✅ 脏话自动替换
- ✅ 敏感内容检测（校园欺凌、家庭暴力等）
- ✅ 友好词自动转换
- ✅ 数据库层二次过滤

### 用户安全
- ✅ 匿名模式保护隐私
- ✅ 昵称敏感词过滤
- ✅ 无需注册，无个人信息泄露
- ✅ 防刷屏限制

---

## 📊 性能指标

- **首页加载**: < 2 秒
- **图片上传**: < 5 秒
- **发帖响应**: < 1 秒
- **排行榜查询**: < 1 秒

---

## 🎨 UI 设计规范

### 配色方案
- **背景**: `#121212` (护眼深灰)
- **主色**: `#0066CC` (青春蓝)
- **辅色**: `#FF6B35` (活力橙)
- **表白墙**: 粉色渐变

### 字体大小
- **标题**: 24px / 18px
- **正文**: 15px
- **辅助**: 12px

---

## 📝 开发指南

### 本地开发
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
```

### 添加新功能
1. 在 `components/` 创建组件
2. 在 `types/index.ts` 添加类型定义
3. 在 `app/` 添加页面路由
4. 更新 `PROJECT_STATUS.md`

### 数据库变更
1. 编写 SQL 脚本
2. 在 Supabase Dashboard 测试
3. 更新 `DEPLOYMENT_GUIDE.md`

---

## 🐛 常见问题

### Q: 提示 "supabaseUrl is required"
**A**: 检查 `.env.local` 文件是否存在，重启开发服务器。

### Q: 图片上传失败
**A**: 确认 Supabase Storage 中已创建 `images` bucket，且设置为 Public。

### Q: 排行榜显示"暂无数据"
**A**: 发布几条"学习互助"类型的帖子和回复。

更多问题请查看 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)

---

## 📄 文档导航

- 📋 [项目状态](PROJECT_STATUS.md) - 功能完成度和待办事项
- 🚀 [部署指南](DEPLOYMENT_GUIDE.md) - 详细部署步骤
- ✅ [测试清单](TESTING_CHECKLIST.md) - 完整测试流程
- 📝 [更新日志](CHANGELOG.md) - 版本更新记录

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📜 开源协议

本项目基于 [MIT License](LICENSE) 开源。

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Supabase](https://supabase.com/) - 后端即服务
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Lucide Icons](https://lucide.dev/) - 图标库

---

## 📧 联系方式

- **开发者**: AlanDeng
- **学校**: 武冈三中
- **项目**: 校园论坛

---

**⭐ 如果这个项目对你有帮助，请给一个 Star！**

---

© 2025 武冈三中校园论坛. All Rights Reserved.
