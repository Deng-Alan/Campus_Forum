# 武冈三中校园论坛

> 一个专为初中生设计的安全、友好的校园社区平台

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-2.7.17-brightgreen)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue)](https://www.postgresql.org/)
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
- ✅ 后端文件上传（`uploads/`，可替换对象存储）

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
- JDK 17+
- Maven 3.6+
- PostgreSQL 16+ / Redis 7.2（推荐使用项目自带 `docker-compose.yml` 一键启动）

### 安装步骤

#### 1. 克隆项目
```bash
git clone https://github.com/your-username/Campus_Forum.git
cd Campus_Forum
```

#### 2. 安装依赖
```bash
cd frontend
npm install
```

#### 3. 启动数据库与 Redis（推荐）
```bash
docker-compose up -d
```

#### 4. 启动后端服务
```bash
cd backend
mvn spring-boot:run
```

#### 5. 配置前端环境变量（可选）
创建 `frontend/.env.local` 文件：
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### 6. 启动前端开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 📂 项目结构

```
Campus_Forum/
├── frontend/                     # Next.js 前端项目
├── backend/                      # Spring Boot 后端服务
├── docs/                         # 文档（接口对接等）
├── docker-compose.yml            # PostgreSQL + Redis（本地开发）
├── init_database.sql             # 数据库初始化脚本
├── API_DESIGN.md                 # API 设计文档
├── DATABASE_DESIGN.md            # 数据库设计
├── PROJECT_STATUS.md             # 项目状态
├── CHANGELOG.md                  # 更新日志
└── README.md                     # 项目说明
```

---

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide Icons
- **日期**: date-fns

### 后端
- **框架**: Spring Boot 2.7.17 (Java 17)
- **数据库**: PostgreSQL
- **缓存**: Redis
- **ORM**: MyBatis Plus
- **安全**: Spring Security + JWT

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
2. 在本地 PostgreSQL 测试（推荐使用 `docker-compose.yml`）
3. 更新 `init_database.sql` 并同步相关文档

---

## 🐛 常见问题

### Q: 接口请求失败 / fetch failed
**A**: 确认后端已启动（默认 `http://localhost:8080`），并检查 `NEXT_PUBLIC_API_BASE_URL` 配置。

### Q: 图片上传失败
**A**: 确认后端 `/api/v1/upload/image` 可访问，并检查后端 `campus.upload.path` 目录可写。

### Q: 排行榜显示"暂无数据"
**A**: 发布几条"学习互助"类型的帖子和回复。

更多问题请查看 [frontend/DEPLOY.md](frontend/DEPLOY.md)

---

## 📄 文档导航

- 📋 [项目状态](PROJECT_STATUS.md) - 功能完成度和待办事项
- 🚀 [前端部署指南](frontend/DEPLOY.md) - Vercel 部署说明
- 🔌 [前后端接口对接](docs/frontend-backend-integration.md) - 接口对接关系
- 📚 [API 设计](API_DESIGN.md) - 后端接口定义
- 🗄️ [数据库设计](DATABASE_DESIGN.md) - 数据库结构说明
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
- [Spring Boot](https://spring.io/projects/spring-boot) - 后端框架
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
