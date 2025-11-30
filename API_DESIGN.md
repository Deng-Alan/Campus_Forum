# 校园论坛后端 API 设计文档

> **技术栈**: Spring Boot 2.7.17 + Java 17 + PostgreSQL + MyBatis Plus 3.5.4 + Redis 7.2 + Spring Security + JWT

---

## 目录

1. [通用说明](#通用说明)
2. [认证模块](#1-认证模块-auth)
3. [用户模块](#2-用户模块-user)
4. [帖子模块](#3-帖子模块-post)
5. [评论模块](#4-评论模块-comment)
6. [公告模块](#5-公告模块-announcement)
7. [举报模块](#6-举报模块-report)
8. [申诉模块](#7-申诉模块-appeal)
9. [建议反馈模块](#8-建议反馈模块-suggestion)
10. [排行榜模块](#9-排行榜模块-leaderboard)
11. [文件上传模块](#10-文件上传模块-upload)
12. [管理后台模块](#11-管理后台模块-admin)
13. [数据库表设计](#数据库表设计)

---

## 通用说明

### 基础 URL
```
开发环境: http://localhost:8080/api/v1
生产环境: https://api.example.com/api/v1
```

### 统一响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": { ... },
  "timestamp": 1701234567890
}
```

### 错误码定义
| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（未登录或 Token 过期） |
| 403 | 禁止访问（权限不足） |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

### 认证方式
- 使用 JWT Bearer Token
- Header: `Authorization: Bearer <token>`
- Token 有效期: 7 天
- 刷新机制: 可选实现 Refresh Token

### 分页参数
```
page: 页码，从 1 开始，默认 1
size: 每页数量，默认 20，最大 100
```

### 分页响应格式
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "size": 20,
    "pages": 5
  }
}
```

---

## 1. 认证模块 (Auth)

### 1.1 用户注册
```
POST /auth/register
```

**请求体:**
```json
{
  "username": "zhangsan",
  "nickname": "张三同学",
  "email": "zhangsan@example.com",
  "password": "123456"
}
```

**校验规则:**
- `username`: 3-20 字符，字母数字下划线，唯一
- `nickname`: 2-20 字符
- `email`: 有效邮箱格式，唯一
- `password`: 6-32 字符

**响应:**
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "userId": "uuid-xxx",
    "username": "zhangsan",
    "nickname": "张三同学"
  }
}
```

---

### 1.2 用户登录
```
POST /auth/login
```

**请求体:**
```json
{
  "usernameOrEmail": "zhangsan",
  "password": "123456"
}
```

**响应:**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 604800,
    "user": {
      "userId": "uuid-xxx",
      "username": "zhangsan",
      "nickname": "张三同学",
      "email": "zhangsan@example.com",
      "avatar": "https://..."
    }
  }
}
```

---

### 1.3 获取当前用户信息
```
GET /auth/me
```
**需要认证**: ✅

**响应:**
```json
{
  "code": 200,
  "data": {
    "userId": "uuid-xxx",
    "username": "zhangsan",
    "nickname": "张三同学",
    "email": "zhangsan@example.com",
    "avatar": "https://...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 1.4 修改密码
```
PUT /auth/password
```
**需要认证**: ✅

**请求体:**
```json
{
  "oldPassword": "123456",
  "newPassword": "654321"
}
```

---

### 1.5 登出
```
POST /auth/logout
```
**需要认证**: ✅

> 可选：将 Token 加入 Redis 黑名单

---

## 2. 用户模块 (User)

### 2.1 获取用户资料
```
GET /users/{userId}
```

**响应:**
```json
{
  "code": 200,
  "data": {
    "userId": "uuid-xxx",
    "username": "zhangsan",
    "nickname": "张三同学",
    "avatar": "https://...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### 2.2 更新用户资料
```
PUT /users/profile
```
**需要认证**: ✅

**请求体:**
```json
{
  "nickname": "新昵称",
  "avatar": "https://..."
}
```

---

### 2.3 更新用户名
```
PUT /users/username
```
**需要认证**: ✅

**请求体:**
```json
{
  "username": "newusername"
}
```

---

### 2.4 获取用户偏好设置
```
GET /users/preferences
```
**需要认证**: ✅

**响应:**
```json
{
  "code": 200,
  "data": {
    "isAnonymous": false
  }
}
```

---

### 2.5 更新用户偏好设置
```
PUT /users/preferences
```
**需要认证**: ✅

**请求体:**
```json
{
  "isAnonymous": true
}
```

---

## 3. 帖子模块 (Post)

### 3.1 获取帖子列表
```
GET /posts
```

**查询参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 帖子类型: `campus_fun`, `study_help`, `confession`, `anonymous` |
| subject | string | 否 | 学科筛选（仅 study_help 类型有效） |
| status | string | 否 | 审核状态: `pending`, `approved`, `rejected` |
| page | int | 否 | 页码，默认 1 |
| size | int | 否 | 每页数量，默认 20 |

**响应:**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "uuid-xxx",
        "content": "帖子内容...",
        "authorName": "张三同学",
        "avatarUrl": "https://...",
        "type": "campus_fun",
        "subject": null,
        "imageUrl": "https://...",
        "likes": 10,
        "commentCount": 5,
        "isFeatured": false,
        "reviewStatus": "approved",
        "quotedPost": {
          "id": "uuid-yyy",
          "content": "引用的帖子内容...",
          "authorName": "李四"
        },
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "size": 20
  }
}
```

---

### 3.2 获取帖子详情
```
GET /posts/{postId}
```

**响应:** 同上单个帖子结构

---

### 3.3 创建帖子
```
POST /posts
```
**需要认证**: ✅

**请求体:**
```json
{
  "content": "帖子内容...",
  "type": "campus_fun",
  "subject": "数学",
  "imageUrl": "https://...",
  "quotedPostId": "uuid-xxx"
}
```

**业务逻辑:**
1. 检查每日发帖上限（从 system_settings 读取）
2. 内容敏感词过滤
3. 新帖子默认 `review_status = 'pending'`
4. 记录发帖计数（存 Redis，每日重置）

**响应:**
```json
{
  "code": 200,
  "message": "发布成功，已提交审核",
  "data": {
    "id": "uuid-xxx",
    "dailyPostCount": 2,
    "dailyPostLimit": 3
  }
}
```

---

### 3.4 删除帖子
```
DELETE /posts/{postId}
```
**需要认证**: ✅

> 只能删除自己的帖子

---

### 3.5 点赞帖子
```
POST /posts/{postId}/like
```
**需要认证**: ✅

**响应:**
```json
{
  "code": 200,
  "data": {
    "likes": 11
  }
}
```

> 可选：防止重复点赞（存 Redis Set）

---

### 3.6 获取我的帖子
```
GET /posts/my
```
**需要认证**: ✅

**查询参数:** `page`, `size`

---

## 4. 评论模块 (Comment)

### 4.1 获取帖子评论列表
```
GET /posts/{postId}/comments
```

**查询参数:** `page`, `size`

**响应:**
```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "uuid-xxx",
        "postId": "uuid-yyy",
        "content": "评论内容...",
        "authorName": "李四同学",
        "likes": 3,
        "createdAt": "2024-01-01T12:30:00Z"
      }
    ],
    "total": 20
  }
}
```

---

### 4.2 创建评论
```
POST /posts/{postId}/comments
```
**需要认证**: ✅

**请求体:**
```json
{
  "content": "评论内容..."
}
```

---

### 4.3 删除评论
```
DELETE /comments/{commentId}
```
**需要认证**: ✅

> 只能删除自己的评论

---

### 4.4 点赞评论
```
POST /comments/{commentId}/like
```
**需要认证**: ✅

---

## 5. 公告模块 (Announcement)

### 5.1 获取公告列表
```
GET /announcements
```

**查询参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| limit | int | 获取数量，默认 5 |

**响应:**
```json
{
  "code": 200,
  "data": [
    {
      "id": "uuid-xxx",
      "title": "公告标题",
      "content": "公告内容...",
      "type": "notice",
      "isTop": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## 6. 举报模块 (Report)

### 6.1 提交举报
```
POST /reports
```
**需要认证**: ✅ (可选)

**请求体:**
```json
{
  "postId": "uuid-xxx",
  "reason": "举报理由..."
}
```

---

## 7. 申诉模块 (Appeal)

### 7.1 提交申诉
```
POST /appeals
```
**需要认证**: ✅

**请求体:**
```json
{
  "postId": "uuid-xxx",
  "reason": "申诉理由..."
}
```

**业务逻辑:**
- 只能对自己被拒绝/下架的帖子申诉
- 同一帖子不能重复申诉（pending 状态）

---

### 7.2 获取我的申诉列表
```
GET /appeals/my
```
**需要认证**: ✅

---

## 8. 建议反馈模块 (Suggestion)

### 8.1 提交建议
```
POST /suggestions
```
**需要认证**: ✅ (可选)

**请求体:**
```json
{
  "content": "建议内容...",
  "category": "feature",
  "isAnonymous": false
}
```

**category 可选值:**
- `general` - 通用建议
- `feature` - 功能建议
- `bug` - Bug 反馈
- `improvement` - 体验优化

---

## 9. 排行榜模块 (Leaderboard)

### 9.1 获取学霸排行榜
```
GET /leaderboard/study
```

**查询参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| days | int | 时间范围：7（本周）、30（本月）、365（全年） |
| subject | string | 学科筛选，可选 |
| limit | int | 返回数量，默认 10 |

**响应:**
```json
{
  "code": 200,
  "data": [
    {
      "rank": 1,
      "authorName": "学霸同学",
      "postCount": 10,
      "commentCount": 25,
      "totalLikes": 50,
      "score": 85.0
    }
  ]
}
```

**积分计算规则:**
- 发题（study_help）: +2 分
- 答题（study_help 评论）: +1 分
- 获赞: +0.5 分

---

## 10. 文件上传模块 (Upload)

### 10.1 上传图片
```
POST /upload/image
```
**需要认证**: ✅

**Content-Type:** `multipart/form-data`

**请求参数:**
| 参数 | 类型 | 说明 |
|------|------|------|
| file | File | 图片文件 |
| type | string | 类型: `avatar`, `post` |

**限制:**
- 支持格式: jpg, jpeg, png, gif, webp
- 头像最大: 2MB
- 帖子图片最大: 5MB

**响应:**
```json
{
  "code": 200,
  "data": {
    "url": "https://storage.example.com/images/xxx.jpg",
    "filename": "xxx.jpg"
  }
}
```

---

## 11. 管理后台模块 (Admin)

> 所有管理后台接口需要 **管理员权限**

### 11.1 管理员登录
```
POST /admin/login
```

**请求体:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

---

### 11.2 获取统计数据
```
GET /admin/stats
```

**响应:**
```json
{
  "code": 200,
  "data": {
    "totalPosts": 1000,
    "studyHelpPosts": 300,
    "confessionPosts": 200,
    "anonymousPosts": 150,
    "announcements": 10,
    "pendingReports": 5,
    "totalComments": 5000,
    "totalUsers": 500
  }
}
```

---

### 11.3 获取图表数据（最近 N 天）
```
GET /admin/stats/chart
```

**查询参数:** `days` (默认 7)

**响应:**
```json
{
  "code": 200,
  "data": [
    { "date": "12/1", "posts": 10, "comments": 25 },
    { "date": "12/2", "posts": 15, "comments": 30 }
  ]
}
```

---

### 11.4 帖子管理 - 获取列表
```
GET /admin/posts
```

**查询参数:**
| 参数 | 说明 |
|------|------|
| type | 帖子类型 |
| reviewStatus | 审核状态 |
| keyword | 搜索关键词（内容/作者） |
| page, size | 分页 |

---

### 11.5 帖子管理 - 审核
```
PUT /admin/posts/{postId}/review
```

**请求体:**
```json
{
  "status": "approved"
}
```

**status 可选值:** `approved`, `rejected`

---

### 11.6 帖子管理 - 删除
```
DELETE /admin/posts/{postId}
```

---

### 11.7 帖子管理 - 设置/取消精选
```
PUT /admin/posts/{postId}/feature
```

**请求体:**
```json
{
  "isFeatured": true
}
```

---

### 11.8 公告管理 - CRUD
```
GET    /admin/announcements          # 列表
POST   /admin/announcements          # 创建
PUT    /admin/announcements/{id}     # 更新
DELETE /admin/announcements/{id}     # 删除
PUT    /admin/announcements/{id}/top # 置顶/取消置顶
```

**创建/更新请求体:**
```json
{
  "title": "公告标题",
  "content": "公告内容",
  "type": "notice",
  "isTop": false
}
```

**type 可选值:** `notice`, `activity`, `urgent`

---

### 11.9 举报管理
```
GET /admin/reports
```

**查询参数:** `status` (`pending`, `resolved`, `ignored`)

```
PUT /admin/reports/{reportId}
```

**请求体:**
```json
{
  "status": "resolved",
  "deletePost": true
}
```

---

### 11.10 申诉管理
```
GET /admin/appeals
```

**查询参数:** `status` (`pending`, `approved`, `rejected`)

```
PUT /admin/appeals/{appealId}
```

**请求体:**
```json
{
  "status": "approved",
  "adminResponse": "管理员回复..."
}
```

**业务逻辑:**
- `approved`: 恢复帖子状态为 `approved`
- `rejected`: 维持原状态

---

### 11.11 建议管理
```
GET /admin/suggestions
```

**查询参数:** `category`, `status`

```
PUT /admin/suggestions/{suggestionId}
```

**请求体:**
```json
{
  "status": "accepted",
  "adminResponse": "感谢您的建议..."
}
```

**status 可选值:** `pending`, `reviewing`, `accepted`, `rejected`, `implemented`

---

### 11.12 评论管理
```
GET    /admin/comments       # 列表
DELETE /admin/comments/{id}  # 删除
```

---

### 11.13 系统设置
```
GET /admin/settings
PUT /admin/settings
```

**请求体:**
```json
{
  "daily_post_limit": "5"
}
```

---

## 数据库表设计

### user_profiles（用户资料表）
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    role VARCHAR(20) DEFAULT 'user',  -- user, admin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### user_preferences（用户偏好表）
```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES user_profiles(id) ON DELETE CASCADE,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### posts（帖子表）
```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(50) NOT NULL,
    avatar_url VARCHAR(500),
    type VARCHAR(20) NOT NULL,  -- campus_fun, study_help, confession, anonymous
    subject VARCHAR(20),  -- 学科（仅 study_help）
    image_url VARCHAR(500),
    likes INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    review_status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
    status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected, removed
    quoted_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_review_status ON posts(review_status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

### comments（评论表）
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(50) NOT NULL,
    likes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
```

### announcements（公告表）
```sql
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    type VARCHAR(20) DEFAULT 'notice',  -- notice, activity, urgent
    is_top BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### reports（举报表）
```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, resolved, ignored
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### appeals（申诉表）
```sql
CREATE TABLE appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
    admin_response TEXT,
    admin_id UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### suggestions（建议表）
```sql
CREATE TABLE suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    category VARCHAR(20) DEFAULT 'general',  -- general, feature, bug, improvement
    status VARCHAR(20) DEFAULT 'pending',  -- pending, reviewing, accepted, rejected, implemented
    is_anonymous BOOLEAN DEFAULT false,
    admin_response TEXT,
    admin_id UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### system_settings（系统设置表）
```sql
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始数据
INSERT INTO system_settings (key, value, description) VALUES 
('daily_post_limit', '3', '每日发帖上限');
```

### daily_post_counts（每日发帖计数 - 可用 Redis 替代）
```sql
CREATE TABLE daily_post_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    count INT DEFAULT 0,
    UNIQUE(user_id, date)
);
```

---

## Redis 缓存设计

### Key 命名规范
```
forum:user:session:{userId}        # 用户会话信息
forum:post:likes:{postId}          # 帖子点赞用户集合 (Set)
forum:comment:likes:{commentId}    # 评论点赞用户集合 (Set)
forum:daily:post:{userId}:{date}   # 每日发帖计数
forum:token:blacklist:{token}      # Token 黑名单
forum:leaderboard:{days}:{subject} # 排行榜缓存
```

### 缓存策略
| 数据 | TTL | 策略 |
|------|-----|------|
| 排行榜 | 5 分钟 | 定时刷新 |
| 帖子列表 | 1 分钟 | 写时失效 |
| 每日发帖计数 | 到当天 23:59:59 | 自动过期 |
| Token 黑名单 | 与 Token 有效期一致 | 登出时写入 |

---

## 接口统计

| 模块 | 接口数量 |
|------|----------|
| 认证 | 5 |
| 用户 | 5 |
| 帖子 | 6 |
| 评论 | 4 |
| 公告 | 1 |
| 举报 | 1 |
| 申诉 | 2 |
| 建议 | 1 |
| 排行榜 | 1 |
| 文件上传 | 1 |
| 管理后台 | 15+ |
| **总计** | **约 42 个接口** |

---

## 附录：前端对接改造清单

改造完成后，前端需要修改以下文件：

| 文件 | 改造内容 |
|------|----------|
| `lib/supabase.ts` | 删除，改为 API 请求封装 |
| `hooks/useAuth.ts` | 改为调用 `/api/v1/auth/*` 接口 |
| `hooks/useUser.ts` | 改为调用 `/api/v1/users/*` 接口 |
| `components/ImageUpload.tsx` | 改为调用 `/api/v1/upload/image` |
| `components/UserSettings.tsx` | 头像上传改为新接口 |
| `components/PostCard.tsx` | 点赞、删除、举报改为新接口 |
| `components/CommentSection.tsx` | 评论 CRUD 改为新接口 |
| `components/Leaderboard.tsx` | 排行榜改为新接口 |
| `components/AppealDialog.tsx` | 申诉改为新接口 |
| `components/SuggestionDialog.tsx` | 建议改为新接口 |
| `app/page.tsx` | 帖子列表、创建帖子改为新接口 |
| `app/my-posts/page.tsx` | 我的帖子改为新接口 |
| `app/admin/page.tsx` | 管理后台所有接口改造 |
| `app/sitemap.ts` | 改为调用后端接口获取帖子列表 |

---

**文档版本**: v1.0  
**创建日期**: 2024-11-30  
**维护者**: Campus Forum Team
