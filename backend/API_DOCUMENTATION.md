# 校园论坛后端 API 文档

> 基础路径：`http://localhost:8080/api/v1`  
> 认证方式：Bearer Token（在 Header 中添加 `Authorization: Bearer <accessToken>`）

**统一响应格式：**

所有接口统一返回如下结构：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": { "...": "..." },
  "timestamp": 1733400000000
}
```

- `code`：业务状态码，详见「错误码说明」章节。
- `message`：提示消息。
- `data`：具体业务数据，类型因接口而异。
- `timestamp`：服务器时间戳（毫秒）。

> 说明：文档中的示例响应可能省略 `timestamp` 字段，仅展示与业务相关的核心字段。

---

## 目录

- [认证模块](#认证模块)
- [帖子模块](#帖子模块)
- [评论模块](#评论模块)
- [举报模块](#举报模块)
- [申诉模块](#申诉模块)
- [建议模块](#建议模块)
- [公告模块](#公告模块)
- [排行榜模块](#排行榜模块)
- [管理后台](#管理后台)

---

## 认证模块

### 1. 用户注册

**POST** `/auth/register`

**请求体：**
```json
{
  "username": "zhangsan",
  "nickname": "张三同学",
  "email": "zhangsan@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "student"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "注册成功",
  "data": null
}
```

---

### 2. 用户登录

**POST** `/auth/login`

**请求体：**
```json
{
  "usernameOrEmail": "zhangsan",
  "password": "password123"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "id": "aef3b239515e4855b4da1b75c05bb7b1",
      "username": "zhangsan",
      "nickname": "张三同学",
      "email": "zhangsan@example.com",
      "role": "user"
    }
  }
}
```

---

### 3. 获取当前用户信息

**GET** `/auth/me`

**需要认证：** ✅

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": "aef3b239515e4855b4da1b75c05bb7b1",
    "username": "zhangsan",
    "nickname": "张三同学",
    "email": "zhangsan@example.com",
    "role": "user"
  }
}
```

---

### 4. 刷新令牌

**POST** `/auth/refresh-token`

**查询参数：**
- `refreshToken` - 刷新令牌

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": { ... }
  }
}
```

---

### 5. 退出登录

**POST** `/auth/logout`

**需要认证：** ✅

**响应：**
```json
{
  "code": 200,
  "message": "登出成功",
  "data": null
}
```

> 注意：登出后 Token 会被加入 Redis 黑名单，无法再使用

---

## 帖子模块

### 1. 获取帖子列表

**GET** `/posts`

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码，默认 1 |
| size | Integer | 否 | 每页数量，默认 20 |
| type | String | 否 | 帖子类型：study_help / campus_fun / confession / anonymous |
| subject | String | 否 | 学科筛选 |
| reviewStatus | String | 否 | 审核状态，默认 approved |

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": "e03fa9d9ae164e2795e778f513494eb9",
        "content": "这是我在校园论坛发的第一条帖子～",
        "authorName": "张三同学",
        "avatarUrl": null,
        "type": "campus_fun",
        "subject": null,
        "imageUrl": null,
        "likes": 0,
        "commentCount": 1,
        "isFeatured": false,
        "reviewStatus": "approved",
        "status": "approved",
        "createdAt": "2025-12-05T22:11:50Z"
      }
    ],
    "total": 1,
    "page": 1,
    "size": 20
  }
}
```

---

### 2. 获取帖子详情

**GET** `/posts/{postId}`

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": "e03fa9d9ae164e2795e778f513494eb9",
    "content": "这是我在校园论坛发的第一条帖子～",
    "authorName": "张三同学",
    "type": "campus_fun",
    "likes": 0,
    "commentCount": 1,
    "isFeatured": false,
    "reviewStatus": "approved",
    "createdAt": "2025-12-05T22:11:50Z"
  }
}
```

---

### 3. 发布帖子

**POST** `/posts`

**需要认证：** ✅

**请求体：**
```json
{
  "content": "这是帖子内容",
  "type": "campus_fun",
  "subject": null,
  "imageUrl": null
}
```

**type 可选值：**
- `study_help` - 学习互助
- `campus_fun` - 校园趣事
- `confession` - 表白墙
- `anonymous` - 匿名区

**响应：**
```json
{
  "code": 200,
  "message": "发布成功，已提交审核",
  "data": {
    "id": "33a4e8f6ce174a5c98839ec82bab9cdb",
    "dailyPostCount": 1,
    "dailyPostLimit": 3
  }
}
```

---

### 4. 获取我的帖子

**GET** `/posts/my`

**需要认证：** ✅

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码，默认 1 |
| size | Integer | 否 | 每页数量，默认 20 |

**响应：** 同帖子列表

---

### 5. 点赞/取消点赞帖子

**POST** `/posts/{postId}/like`

**需要认证：** ✅

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "likes": 1
  }
}
```

> 再次调用会取消点赞，likes 变为 0

---

## 评论模块

### 1. 获取评论列表

**GET** `/posts/{postId}/comments`

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | Integer | 否 | 页码，默认 1 |
| size | Integer | 否 | 每页数量，默认 20 |

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": "898f0abece81477caa5efce89429cb20",
        "postId": "e03fa9d9ae164e2795e778f513494eb9",
        "content": "这是第一条评论",
        "authorName": "张三同学",
        "likes": 0,
        "createdAt": "2025-12-05T22:40:31Z"
      }
    ],
    "total": 1,
    "page": 1,
    "size": 20
  }
}
```

---

### 2. 发表评论

**POST** `/posts/{postId}/comments`

**需要认证：** ✅

**请求体：**
```json
{
  "content": "这是评论内容"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": null
}
```

---

### 3. 点赞/取消点赞评论

**POST** `/comments/{commentId}/like`

**需要认证：** ✅

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "likes": 1
  },
  "success": true
}
```

---

### 4. 删除评论

**DELETE** `/comments/{commentId}`

**需要认证：** ✅（只能删除自己的评论）

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": null,
  "success": true
}
```

---

## 举报模块

### 1. 提交举报

**POST** `/reports`

**需要认证：** 可选（支持匿名举报）

**请求体：**
```json
{
  "postId": "e03fa9d9ae164e2795e778f513494eb9",
  "reason": "这条帖子涉嫌违规内容"
}
```

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": null,
  "success": true
}
```

---

## 申诉模块

### 1. 提交申诉

**POST** `/appeals`

**需要认证：** ✅

**请求体：**
```json
{
  "postId": "33a4e8f6ce174a5c98839ec82bab9cdb",
  "reason": "这条帖子内容合规，请重新审核"
}
```

> 注意：只能对自己的、且审核状态为 `rejected` 的帖子申诉

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": null,
  "success": true
}
```

---

### 2. 获取我的申诉列表

**GET** `/appeals/my`

**需要认证：** ✅

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": "6995780976974877aba6cf781b66b846",
        "postId": "33a4e8f6ce174a5c98839ec82bab9cdb",
        "reason": "这条帖子内容合规，请重新审核",
        "status": "pending",
        "adminResponse": null,
        "createdAt": "2025-12-05T23:57:16Z"
      }
    ],
    "total": 1,
    "page": 1,
    "size": 20
  }
}
```

---

## 建议模块

### 1. 提交建议

**POST** `/suggestions`

**需要认证：** 可选（支持匿名提交）

**请求体：**
```json
{
  "content": "希望增加夜间模式功能",
  "category": "feature",
  "isAnonymous": false
}
```

**category 可选值：**
- `general` - 一般建议
- `feature` - 功能需求
- `bug` - Bug 反馈
- `improvement` - 改进建议

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": null,
  "success": true
}
```

---

## 公告模块

### 1. 获取公告列表

**GET** `/announcements`

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | Integer | 否 | 返回数量，默认 5 |

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": "b3a85c4ba6fb439495fd3e07a09d6fcd",
      "title": "期末考试安排",
      "content": "考试时间12月20日至30日",
      "type": "notice",
      "isTop": true,
      "createdAt": "2025-12-05T23:39:54Z"
    }
  ]
}
```

---

## 排行榜模块

### 1. 获取学霸排行榜

**GET** `/leaderboard/study`

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| days | Integer | 否 | 时间范围（7/30/365），默认 7 |
| subject | String | 否 | 学科筛选 |
| limit | Integer | 否 | 返回数量，默认 10 |

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "rank": 1,
      "authorName": "张三同学",
      "postCount": 5,
      "commentCount": 10,
      "totalLikes": 20,
      "score": 30.0
    }
  ]
}
```

> 积分计算规则：发帖 +2，评论 +1，获赞 +0.5

---

## 管理后台

> 以下接口需要 **管理员权限**（role = admin）

### 1. 获取统计数据

**GET** `/admin/stats`

**需要认证：** ✅ (Admin)

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "totalPosts": 6,
    "studyHelpPosts": 0,
    "confessionPosts": 0,
    "anonymousPosts": 0,
    "announcements": 0,
    "pendingReports": 0,
    "totalComments": 1,
    "totalUsers": 2
  }
}
```

---

### 2. 获取图表数据

**GET** `/admin/stats/chart`

**需要认证：** ✅ (Admin)

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| days | Integer | 否 | 天数，默认 7 |

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    { "date": "12/1", "posts": 0, "comments": 0 },
    { "date": "12/2", "posts": 0, "comments": 0 },
    { "date": "12/5", "posts": 6, "comments": 1 }
  ]
}
```

---

### 3. 审核帖子

**PUT** `/admin/posts/{postId}/review`

**需要认证：** ✅ (Admin)

**请求体：**
```json
{
  "status": "approved"
}
```

**status 可选值：**
- `approved` - 通过
- `rejected` - 拒绝

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": null,
  "success": true
}
```

---

### 4. 设置/取消精选

**PUT** `/admin/posts/{postId}/feature`

**需要认证：** ✅ (Admin)

**请求体：**
```json
{
  "isFeatured": true
}
```

---

### 5. 删除帖子

**DELETE** `/admin/posts/{postId}`

**需要认证：** ✅ (Admin)

---

### 6. 删除评论

**DELETE** `/admin/comments/{commentId}`

**需要认证：** ✅ (Admin)

---

### 7. 获取举报列表

**GET** `/admin/reports`

**需要认证：** ✅ (Admin)

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | String | 否 | 状态筛选：pending / resolved / ignored |

---

### 8. 处理举报

**PUT** `/admin/reports/{reportId}`

**需要认证：** ✅ (Admin)

**请求体：**
```json
{
  "status": "resolved",
  "deletePost": false
}
```

---

### 9. 获取申诉列表

**GET** `/admin/appeals`

**需要认证：** ✅ (Admin)

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | String | 否 | 状态筛选：pending / approved / rejected |

---

### 10. 处理申诉

**PUT** `/admin/appeals/{appealId}`

**需要认证：** ✅ (Admin)

**请求体：**
```json
{
  "status": "approved",
  "adminResponse": "经核实帖子内容合规，已恢复"
}
```

> 如果 status 为 approved，帖子会自动恢复为已审核状态

---

### 11. 获取建议列表

**GET** `/admin/suggestions`

**需要认证：** ✅ (Admin)

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | String | 否 | 分类筛选 |
| status | String | 否 | 状态筛选 |

---

### 12. 处理建议

**PUT** `/admin/suggestions/{suggestionId}`

**需要认证：** ✅ (Admin)

**请求体：**
```json
{
  "status": "accepted",
  "adminResponse": "已采纳，排入开发计划"
}
```

**status 可选值：**
- `pending` - 待处理
- `reviewing` - 处理中
- `accepted` - 已采纳
- `rejected` - 已拒绝
- `implemented` - 已上线/已完成

---

### 13. 创建公告

**POST** `/admin/announcements`

**需要认证：** ✅ (Admin)

**请求体：**
```json
{
  "title": "期末考试安排通知",
  "content": "本学期期末考试时间为12月20日至12月30日",
  "type": "notice",
  "isTop": true
}
```

**type 可选值：**
- `notice` - 通知
- `activity` - 活动
- `urgent` - 紧急

---

### 14. 更新公告

**PUT** `/admin/announcements/{announcementId}`

**需要认证：** ✅ (Admin)

**请求体：** 同创建公告

---

### 15. 删除公告

**DELETE** `/admin/announcements/{announcementId}`

**需要认证：** ✅ (Admin)

---

### 16. 获取系统设置

**GET** `/admin/settings`

**需要认证：** ✅ (Admin)

**响应：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "daily_post_limit": "3"
  },
  "success": true
}
```

---

### 17. 更新系统设置

**PUT** `/admin/settings`

**需要认证：** ✅ (Admin)

**请求体：**
```json
{
  "daily_post_limit": "5"
}
```

---

## 错误码说明

| code | 说明 |
|------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token 无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 1001 | 用户不存在 |
| 1002 | 用户已存在 |
| 1003 | 密码错误 |
| 1004 | 账号已禁用 |
| 1005 | 登录已过期，请重新登录 |
| 1006 | 无效的 Token |
| 1007 | 验证码错误 |
| 1008 | 验证码已过期 |

---

## 测试账号

| 角色 | 用户名 | 密码 | 邮箱 |
|------|--------|------|------|
| 管理员 | AlanDeng | dwb918112 | alandeng@example.com |

---

## 环境依赖

| 服务 | 端口 | 说明 |
|------|------|------|
| Spring Boot | 8080 | 后端服务 |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存/点赞/黑名单 |

---

*文档生成时间：2025-12-05*
