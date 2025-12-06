# 前端后端接口对接文档

## 概述
本文档详细说明了校园论坛前端各模块与后端接口的对接关系。

## 接口基础信息
- **后端地址**: `http://localhost:8080/api/v1`
- **认证方式**: JWT Token（放在 Authorization header）
- **响应格式**: 
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

## 各模块接口对照表

### 1. 认证模块

| 页面/组件 | 前端文件 | 后端接口 | 说明 |
|---------|---------|---------|-----|
| 注册页面 | `app/register/page.tsx` | `POST /auth/register` | 用户注册 |
| 登录页面 | `app/login/page.tsx` | `POST /auth/login` | 用户登录 |
| 认证Hook | `hooks/useAuth.ts` | `POST /auth/refresh` | Token刷新 |
| 退出登录 | `hooks/useAuth.ts` | `POST /auth/logout` | 注销登录 |

### 2. 用户模块

| 页面/组件 | 前端文件 | 后端接口 | 说明 |
|---------|---------|---------|-----|
| 用户信息获取 | `hooks/useUser.ts` | `GET /users/me` | 获取当前用户信息 |
| 个人资料设置 | `components/UserSettings.tsx` | `PUT /users/profile` | 更新个人资料 |
| 用户偏好 | `components/UserSettings.tsx` | `PUT /users/preferences` | 更新偏好设置 |
| 查看他人资料 | - | `GET /users/{id}/profile` | 获取指定用户信息 |

### 3. 帖子模块

| 页面/组件 | 前端文件 | 后端接口 | 说明 |
|---------|---------|---------|-----|
| 首页帖子列表 | `app/page.tsx` | `GET /posts` | 获取帖子列表（支持type参数筛选） |
| 发布帖子 | `components/CreatePost.tsx` | `POST /posts` | 创建新帖子 |
| 帖子详情页 | `app/post/[id]/page.tsx` | `GET /posts/{postId}` | 获取帖子详情 |
| 删除帖子 | `components/PostCard.tsx` | `DELETE /posts/{id}` | 删除帖子 |
| 点赞帖子 | `components/PostCard.tsx` | `POST /posts/{id}/like` | 点赞/取消点赞 |
| 我的帖子 | `app/my-posts/page.tsx` | `GET /posts/my` | 获取当前用户的帖子 |

### 4. 评论模块

| 页面/组件 | 前端文件 | 后端接口 | 说明 |
|---------|---------|---------|-----|
| 评论列表 | `components/CommentSection.tsx` | `GET /posts/{postId}/comments` | 获取帖子评论 |
| 发表评论 | `components/CommentSection.tsx` | `POST /posts/{postId}/comments` | 发表评论 |
| 删除评论 | `components/CommentSection.tsx` | `DELETE /comments/{id}` | 删除评论 |
| 点赞评论 | `components/CommentSection.tsx` | `POST /comments/{id}/like` | 点赞评论 |

### 5. 反馈模块

| 页面/组件 | 前端文件 | 后端接口 | 说明 |
|---------|---------|---------|-----|
| 举报帖子 | `components/ReportDialog.tsx` | `POST /reports` | 提交举报 |
| 申诉帖子 | `components/AppealDialog.tsx` | `POST /appeals` | 提交申诉 |
| 我的申诉 | `app/my-appeals/page.tsx` | `GET /appeals/my` | 获取我的申诉记录 |
| 提交建议 | `components/SuggestionBox.tsx` | `POST /suggestions` | 提交建议 |

### 6. 排行榜模块

| 页面/组件 | 前端文件 | 后端接口 | 说明 |
|---------|---------|---------|-----|
| 学霸排行榜 | `components/Leaderboard.tsx` | `GET /leaderboard/study` | 获取学习互助排行榜 |

### 7. 文件上传

| 页面/组件 | 前端文件 | 后端接口 | 说明 |
|---------|---------|---------|-----|
| 帖子图片上传 | `components/ImageUpload.tsx` | `POST /upload/image?type=post` | 上传帖子配图 |
| 头像上传 | `components/UserSettings.tsx` | `POST /upload/image?type=avatar` | 上传用户头像 |

### 8. 管理后台

| 页面/功能 | 前端文件 | 后端接口 | 说明 |
|---------|---------|---------|-----|
| 管理员登录 | `app/admin/login/page.tsx` | `POST /auth/login` | 管理员登录（同普通用户） |
| 统计数据 | `app/admin/page.tsx` | `GET /admin/stats` | 获取统计概览 |
| 图表数据 | `app/admin/page.tsx` | `GET /admin/charts` | 获取趋势图表数据 |
| **帖子管理** | | | |
| 帖子列表 | `app/admin/page.tsx` | `GET /admin/posts` | 获取所有帖子 |
| 审核帖子 | `app/admin/page.tsx` | `PUT /admin/posts/{id}/review` | 通过/驳回审核 |
| 设置精选 | `app/admin/page.tsx` | `PUT /admin/posts/{id}/feature` | 设置/取消精选 |
| 删除帖子 | `app/admin/page.tsx` | `DELETE /admin/posts/{id}` | 管理员删除帖子 |
| **举报处理** | | | |
| 举报列表 | `app/admin/page.tsx` | `GET /admin/reports` | 获取举报列表 |
| 处理举报 | `app/admin/page.tsx` | `PUT /admin/reports/{id}` | 处理举报（已处理/忽略） |
| **申诉管理** | | | |
| 申诉列表 | `app/admin/page.tsx` | `GET /admin/appeals` | 获取申诉列表 |
| 处理申诉 | `app/admin/page.tsx` | `PUT /admin/appeals/{id}` | 通过/驳回申诉 |
| **建议管理** | | | |
| 建议列表 | `app/admin/page.tsx` | `GET /admin/suggestions` | 获取建议列表 |
| 处理建议 | `app/admin/page.tsx` | `PUT /admin/suggestions/{id}` | 更新建议状态 |
| **公告管理** | | | |
| 公告列表 | `app/admin/page.tsx` | `GET /admin/announcements` | 获取公告列表 |
| 创建公告 | `app/admin/page.tsx` | `POST /admin/announcements` | 发布新公告 |
| 更新公告 | `app/admin/page.tsx` | `PUT /admin/announcements/{id}` | 修改公告 |
| 删除公告 | `app/admin/page.tsx` | `DELETE /admin/announcements/{id}` | 删除公告 |
| **系统设置** | | | |
| 获取设置 | `app/admin/page.tsx` | `GET /admin/settings` | 获取系统配置 |
| 更新设置 | `app/admin/page.tsx` | `PUT /admin/settings` | 更新系统配置 |

## API 调用工具说明

### 1. 统一的 API 客户端
位置：`lib/api.ts`

主要方法：
- `apiGet<T>(path, params)` - GET请求
- `apiPost<T>(path, body)` - POST请求
- `apiPut<T>(path, body)` - PUT请求
- `apiDelete<T>(path)` - DELETE请求

特性：
- 自动添加 JWT Token
- 统一错误处理
- 自动 Token 刷新
- TypeScript 类型支持

### 2. 文件上传（待优化）
当前状态：
- `ImageUpload.tsx` 和 `UserSettings.tsx` 中直接使用 fetch
- 需要统一封装到 `lib/api.ts`

## 数据流说明

### 1. 认证流程
```
用户登录 → 获取 JWT Token → 存储到 localStorage 
→ 后续请求自动携带 Token → Token 过期自动刷新
```

### 2. 帖子发布流程
```
填写内容 → 上传图片(可选) → 提交到后端 
→ 后端审核 → 审核通过后显示在列表
```

### 3. 状态管理
- 用户信息：通过 `useUser` Hook 全局管理
- 认证状态：通过 `useAuth` Hook 全局管理
- 页面数据：组件内部 useState 管理
- 实时更新：操作成功后直接更新本地 state

## 注意事项

1. **Token 处理**
   - Token 存储在 localStorage 的 `token` 字段
   - 每个请求自动添加 `Authorization: Bearer <token>` header
   - Token 过期时自动尝试刷新

2. **错误处理**
   - 401 错误：Token 失效，尝试刷新或跳转登录
   - 403 错误：权限不足
   - 400 错误：请求参数错误
   - 500 错误：服务器内部错误

3. **图片上传**
   - 最大 5MB
   - 支持格式：jpg, jpeg, png, gif, webp
   - 上传后返回 URL，需要在提交表单时一起发送

4. **分页参数**
   - page：页码，从1开始
   - size：每页数量，默认20
   - 返回格式包含 total、records 等字段

5. **时间格式**
   - 后端返回：ISO 8601 格式（如：2024-12-06T10:30:00）
   - 前端显示：使用相对时间（如：5分钟前）

## 待优化事项

1. **统一文件上传 API**（高优先级）
   - 封装 `uploadImage(file, type)` 方法
   - 统一错误处理
   - 添加上传进度回调

2. **WebSocket 消息推送**（中优先级）
   - 实时通知
   - 在线用户统计

3. **接口缓存优化**（中优先级）
   - 使用 SWR 或 React Query
   - 减少重复请求

4. **错误边界处理**（低优先级）
   - 全局错误捕获
   - 友好错误页面

---

*更新时间：2024-12-06*
