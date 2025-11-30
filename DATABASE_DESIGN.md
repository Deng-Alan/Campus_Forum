# 校园论坛数据库设计文档

> **数据库**: PostgreSQL 16+  
> **ORM**: MyBatis Plus 3.5.4  
> **字符集**: UTF-8

---

## 目录

1. [ER 关系图](#er-关系图)
2. [表结构详细设计](#表结构详细设计)
3. [索引设计](#索引设计)
4. [初始化数据](#初始化数据)
5. [MyBatis Plus 实体类](#mybatis-plus-实体类)

---

## ER 关系图

```
┌─────────────────┐       ┌─────────────────┐
│  user_profiles  │       │ user_preferences│
│─────────────────│       │─────────────────│
│ id (PK)         │◄──────│ user_id (FK)    │
│ username        │       │ is_anonymous    │
│ nickname        │       └─────────────────┘
│ email           │
│ password_hash   │       ┌─────────────────┐
│ avatar          │       │     posts       │
│ role            │       │─────────────────│
└────────┬────────┘       │ id (PK)         │
         │                │ user_id (FK)────┼──────┐
         │                │ content         │      │
         │                │ author_name     │      │
         │                │ type            │      │
         │                │ quoted_post_id──┼──┐   │
         │                └────────┬────────┘  │   │
         │                         │           │   │
         │                         │ (self ref)│   │
         │                         └───────────┘   │
         │                                         │
         │    ┌─────────────────┐                  │
         │    │    comments     │                  │
         │    │─────────────────│                  │
         │    │ id (PK)         │                  │
         └────┤ user_id (FK)    │                  │
              │ post_id (FK)────┼──────────────────┘
              │ content         │
              └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    reports      │  │    appeals      │  │   suggestions   │
│─────────────────│  │─────────────────│  │─────────────────│
│ id (PK)         │  │ id (PK)         │  │ id (PK)         │
│ post_id (FK)    │  │ post_id (FK)    │  │ user_id (FK)    │
│ user_id (FK)    │  │ user_id (FK)    │  │ content         │
│ reason          │  │ reason          │  │ category        │
│ status          │  │ status          │  │ status          │
└─────────────────┘  │ admin_id (FK)   │  │ admin_id (FK)   │
                     └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐
│  announcements  │  │ system_settings │
│─────────────────│  │─────────────────│
│ id (PK)         │  │ key (PK)        │
│ title           │  │ value           │
│ content         │  │ description     │
│ type            │  └─────────────────┘
│ is_top          │
└─────────────────┘
```

---

## 表结构详细设计

### 1. user_profiles（用户资料表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | UUID | PK | gen_random_uuid() | 用户唯一标识 |
| username | VARCHAR(50) | UNIQUE, NOT NULL | - | 用户名（登录用） |
| nickname | VARCHAR(50) | NOT NULL | - | 昵称（显示用） |
| email | VARCHAR(100) | UNIQUE, NOT NULL | - | 邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | - | 密码哈希（BCrypt） |
| avatar | VARCHAR(500) | - | NULL | 头像 URL |
| role | VARCHAR(20) | NOT NULL | 'user' | 角色：user/admin |
| status | VARCHAR(20) | NOT NULL | 'active' | 状态：active/banned/deleted |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

```sql
-- 建表语句
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 添加注释
COMMENT ON TABLE user_profiles IS '用户资料表';
COMMENT ON COLUMN user_profiles.id IS '用户唯一标识';
COMMENT ON COLUMN user_profiles.username IS '用户名（3-20字符，字母数字下划线）';
COMMENT ON COLUMN user_profiles.nickname IS '昵称（2-20字符）';
COMMENT ON COLUMN user_profiles.email IS '邮箱地址';
COMMENT ON COLUMN user_profiles.password_hash IS '密码哈希值（BCrypt）';
COMMENT ON COLUMN user_profiles.avatar IS '头像URL';
COMMENT ON COLUMN user_profiles.role IS '角色：user-普通用户，admin-管理员';
COMMENT ON COLUMN user_profiles.status IS '状态：active-正常，banned-封禁，deleted-注销';
```

---

### 2. user_preferences（用户偏好设置表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | UUID | PK | gen_random_uuid() | 主键 |
| user_id | UUID | FK, UNIQUE, NOT NULL | - | 关联用户 |
| is_anonymous | BOOLEAN | NOT NULL | false | 是否匿名模式 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

```sql
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_preferences_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

COMMENT ON TABLE user_preferences IS '用户偏好设置表';
COMMENT ON COLUMN user_preferences.is_anonymous IS '是否开启匿名模式';
```

---

### 3. posts（帖子表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | UUID | PK | gen_random_uuid() | 帖子唯一标识 |
| user_id | UUID | FK | NULL | 发帖用户（可为空，用于匿名） |
| content | TEXT | NOT NULL | - | 帖子内容 |
| author_name | VARCHAR(50) | NOT NULL | - | 作者显示名称 |
| avatar_url | VARCHAR(500) | - | NULL | 发帖时的头像快照 |
| type | VARCHAR(20) | NOT NULL | - | 帖子类型 |
| subject | VARCHAR(20) | - | NULL | 学科（仅 study_help） |
| image_url | VARCHAR(500) | - | NULL | 图片 URL |
| likes | INT | NOT NULL | 0 | 点赞数 |
| comment_count | INT | NOT NULL | 0 | 评论数（冗余字段） |
| is_featured | BOOLEAN | NOT NULL | false | 是否精选 |
| review_status | VARCHAR(20) | NOT NULL | 'pending' | 审核状态 |
| status | VARCHAR(20) | NOT NULL | 'pending' | 帖子状态 |
| quoted_post_id | UUID | FK | NULL | 引用的帖子 ID |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**type 枚举值:**
- `campus_fun` - 校园趣事
- `study_help` - 学习互助
- `confession` - 表白墙
- `anonymous` - 匿名树洞

**subject 枚举值（仅 study_help）:**
- 数学、物理、化学、生物、英语、语文、历史、地理、政治

**review_status 枚举值:**
- `pending` - 待审核
- `approved` - 已通过
- `rejected` - 已拒绝

**status 枚举值:**
- `pending` - 待审核
- `approved` - 正常
- `rejected` - 审核拒绝
- `removed` - 已下架

```sql
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    content TEXT NOT NULL,
    author_name VARCHAR(50) NOT NULL,
    avatar_url VARCHAR(500),
    type VARCHAR(20) NOT NULL,
    subject VARCHAR(20),
    image_url VARCHAR(500),
    likes INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    review_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    quoted_post_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_posts_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_posts_quoted 
        FOREIGN KEY (quoted_post_id) REFERENCES posts(id) ON DELETE SET NULL,
    CONSTRAINT chk_posts_type 
        CHECK (type IN ('campus_fun', 'study_help', 'confession', 'anonymous')),
    CONSTRAINT chk_posts_review_status 
        CHECK (review_status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT chk_posts_status 
        CHECK (status IN ('pending', 'approved', 'rejected', 'removed'))
);

COMMENT ON TABLE posts IS '帖子表';
COMMENT ON COLUMN posts.type IS '帖子类型：campus_fun-校园趣事，study_help-学习互助，confession-表白墙，anonymous-匿名树洞';
COMMENT ON COLUMN posts.subject IS '学科分类（仅学习互助类型使用）';
COMMENT ON COLUMN posts.comment_count IS '评论数（冗余字段，提升查询性能）';
COMMENT ON COLUMN posts.is_featured IS '是否为精选帖子';
COMMENT ON COLUMN posts.review_status IS '审核状态：pending-待审核，approved-已通过，rejected-已拒绝';
COMMENT ON COLUMN posts.status IS '帖子状态：pending-待审核，approved-正常，rejected-审核拒绝，removed-已下架';
```

---

### 4. comments（评论表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | UUID | PK | gen_random_uuid() | 评论唯一标识 |
| post_id | UUID | FK, NOT NULL | - | 所属帖子 |
| user_id | UUID | FK | NULL | 评论用户 |
| content | TEXT | NOT NULL | - | 评论内容 |
| author_name | VARCHAR(50) | NOT NULL | - | 作者显示名称 |
| likes | INT | NOT NULL | 0 | 点赞数 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID,
    content TEXT NOT NULL,
    author_name VARCHAR(50) NOT NULL,
    likes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_post 
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE comments IS '评论表';
```

---

### 5. announcements（公告表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | UUID | PK | gen_random_uuid() | 公告唯一标识 |
| title | VARCHAR(200) | NOT NULL | - | 公告标题 |
| content | TEXT | - | NULL | 公告内容 |
| type | VARCHAR(20) | NOT NULL | 'notice' | 公告类型 |
| is_top | BOOLEAN | NOT NULL | false | 是否置顶 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**type 枚举值:**
- `notice` - 通知
- `activity` - 活动
- `urgent` - 紧急

```sql
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'notice',
    is_top BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_announcements_type 
        CHECK (type IN ('notice', 'activity', 'urgent'))
);

COMMENT ON TABLE announcements IS '公告表';
COMMENT ON COLUMN announcements.type IS '公告类型：notice-通知，activity-活动，urgent-紧急';
COMMENT ON COLUMN announcements.is_top IS '是否置顶';
```

---

### 6. reports（举报表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | UUID | PK | gen_random_uuid() | 举报唯一标识 |
| post_id | UUID | FK, NOT NULL | - | 被举报的帖子 |
| user_id | UUID | FK | NULL | 举报人（可匿名） |
| reason | TEXT | NOT NULL | - | 举报理由 |
| status | VARCHAR(20) | NOT NULL | 'pending' | 处理状态 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**status 枚举值:**
- `pending` - 待处理
- `resolved` - 已处理
- `ignored` - 已忽略

```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_post 
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
    CONSTRAINT chk_reports_status 
        CHECK (status IN ('pending', 'resolved', 'ignored'))
);

COMMENT ON TABLE reports IS '举报表';
COMMENT ON COLUMN reports.status IS '处理状态：pending-待处理，resolved-已处理，ignored-已忽略';
```

---

### 7. appeals（申诉表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | UUID | PK | gen_random_uuid() | 申诉唯一标识 |
| post_id | UUID | FK, NOT NULL | - | 申诉的帖子 |
| user_id | UUID | FK, NOT NULL | - | 申诉人 |
| reason | TEXT | NOT NULL | - | 申诉理由 |
| status | VARCHAR(20) | NOT NULL | 'pending' | 处理状态 |
| admin_response | TEXT | - | NULL | 管理员回复 |
| admin_id | UUID | FK | NULL | 处理的管理员 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**status 枚举值:**
- `pending` - 待处理
- `approved` - 已通过
- `rejected` - 已驳回

```sql
CREATE TABLE appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_response TEXT,
    admin_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appeals_post 
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_appeals_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_appeals_admin 
        FOREIGN KEY (admin_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
    CONSTRAINT chk_appeals_status 
        CHECK (status IN ('pending', 'approved', 'rejected'))
);

COMMENT ON TABLE appeals IS '申诉表';
COMMENT ON COLUMN appeals.status IS '处理状态：pending-待处理，approved-已通过，rejected-已驳回';
COMMENT ON COLUMN appeals.admin_response IS '管理员回复内容';
```

---

### 8. suggestions（建议反馈表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | UUID | PK | gen_random_uuid() | 建议唯一标识 |
| user_id | UUID | FK | NULL | 提交人（可匿名） |
| content | TEXT | NOT NULL | - | 建议内容 |
| category | VARCHAR(20) | NOT NULL | 'general' | 建议类别 |
| status | VARCHAR(20) | NOT NULL | 'pending' | 处理状态 |
| is_anonymous | BOOLEAN | NOT NULL | false | 是否匿名提交 |
| admin_response | TEXT | - | NULL | 管理员回复 |
| admin_id | UUID | FK | NULL | 处理的管理员 |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

**category 枚举值:**
- `general` - 通用建议
- `feature` - 功能建议
- `bug` - Bug 反馈
- `improvement` - 体验优化

**status 枚举值:**
- `pending` - 待处理
- `reviewing` - 处理中
- `accepted` - 已采纳
- `rejected` - 已拒绝
- `implemented` - 已实现

```sql
CREATE TABLE suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    content TEXT NOT NULL,
    category VARCHAR(20) NOT NULL DEFAULT 'general',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    admin_response TEXT,
    admin_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_suggestions_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_suggestions_admin 
        FOREIGN KEY (admin_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
    CONSTRAINT chk_suggestions_category 
        CHECK (category IN ('general', 'feature', 'bug', 'improvement')),
    CONSTRAINT chk_suggestions_status 
        CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'implemented'))
);

COMMENT ON TABLE suggestions IS '建议反馈表';
COMMENT ON COLUMN suggestions.category IS '建议类别：general-通用，feature-功能，bug-缺陷，improvement-优化';
COMMENT ON COLUMN suggestions.status IS '处理状态：pending-待处理，reviewing-处理中，accepted-已采纳，rejected-已拒绝，implemented-已实现';
```

---

### 9. system_settings（系统设置表）

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| key | VARCHAR(100) | PK | - | 设置键名 |
| value | TEXT | NOT NULL | - | 设置值 |
| description | VARCHAR(255) | - | NULL | 设置说明 |
| updated_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 更新时间 |

```sql
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_settings IS '系统设置表';
```

---

### 10. post_likes（帖子点赞记录表 - 可选）

> 用于防止重复点赞，也可用 Redis Set 实现

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| id | UUID | PK | gen_random_uuid() | 主键 |
| post_id | UUID | FK, NOT NULL | - | 帖子 ID |
| user_id | UUID | FK, NOT NULL | - | 用户 ID |
| created_at | TIMESTAMP | NOT NULL | CURRENT_TIMESTAMP | 点赞时间 |

```sql
CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_post_likes_post 
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_likes_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT uk_post_likes UNIQUE (post_id, user_id)
);

COMMENT ON TABLE post_likes IS '帖子点赞记录表（防止重复点赞）';
```

---

### 11. comment_likes（评论点赞记录表 - 可选）

```sql
CREATE TABLE comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_likes_comment 
        FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_likes_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT uk_comment_likes UNIQUE (comment_id, user_id)
);

COMMENT ON TABLE comment_likes IS '评论点赞记录表';
```

---

## 索引设计

```sql
-- user_profiles 索引
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);

-- posts 索引
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_subject ON posts(subject) WHERE subject IS NOT NULL;
CREATE INDEX idx_posts_review_status ON posts(review_status);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_is_featured ON posts(is_featured) WHERE is_featured = true;
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
-- 复合索引：首页查询优化
CREATE INDEX idx_posts_approved_list ON posts(review_status, is_featured DESC, created_at DESC) 
    WHERE review_status = 'approved';
-- 复合索引：按类型查询优化
CREATE INDEX idx_posts_type_approved ON posts(type, created_at DESC) 
    WHERE review_status = 'approved';

-- comments 索引
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- announcements 索引
CREATE INDEX idx_announcements_is_top ON announcements(is_top DESC, created_at DESC);

-- reports 索引
CREATE INDEX idx_reports_post_id ON reports(post_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- appeals 索引
CREATE INDEX idx_appeals_post_id ON appeals(post_id);
CREATE INDEX idx_appeals_user_id ON appeals(user_id);
CREATE INDEX idx_appeals_status ON appeals(status);

-- suggestions 索引
CREATE INDEX idx_suggestions_user_id ON suggestions(user_id);
CREATE INDEX idx_suggestions_category ON suggestions(category);
CREATE INDEX idx_suggestions_status ON suggestions(status);

-- post_likes 索引
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

-- comment_likes 索引
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
```

---

## 初始化数据

```sql
-- 创建管理员账户（密码: admin123，使用 BCrypt 加密）
INSERT INTO user_profiles (id, username, nickname, email, password_hash, role) VALUES 
(gen_random_uuid(), 'admin', '管理员', 'admin@example.com', 
 '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'admin');

-- 系统设置初始化
INSERT INTO system_settings (key, value, description) VALUES 
('daily_post_limit', '3', '每日发帖上限'),
('post_content_min_length', '5', '帖子内容最小长度'),
('post_content_max_length', '2000', '帖子内容最大长度'),
('comment_content_max_length', '500', '评论内容最大长度'),
('enable_auto_review', 'false', '是否开启自动审核'),
('sensitive_words', '敏感词1,敏感词2', '敏感词列表（逗号分隔）');

-- 示例公告
INSERT INTO announcements (title, content, type, is_top) VALUES 
('欢迎来到武冈三中校园论坛', '这是一个属于我们自己的校园交流平台，请文明发言！', 'notice', true);
```

---

## 触发器（可选）

### 1. 更新评论数触发器

```sql
-- 评论数增加触发器
CREATE OR REPLACE FUNCTION update_post_comment_count_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts SET comment_count = comment_count + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_insert
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count_on_insert();

-- 评论数减少触发器
CREATE OR REPLACE FUNCTION update_post_comment_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts SET comment_count = comment_count - 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_delete
AFTER DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count_on_delete();
```

### 2. 更新时间自动更新触发器

```sql
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有需要的表创建触发器
CREATE TRIGGER trigger_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_announcements_updated_at
BEFORE UPDATE ON announcements
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_appeals_updated_at
BEFORE UPDATE ON appeals
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_suggestions_updated_at
BEFORE UPDATE ON suggestions
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

---

## 完整建库脚本

将上述所有 SQL 整合为一个完整的初始化脚本：

```sql
-- ================================================
-- 校园论坛数据库初始化脚本
-- 数据库: PostgreSQL 16+
-- ================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. 用户资料表
-- [SQL 如上]

-- 2. 用户偏好表
-- [SQL 如上]

-- 3. 帖子表
-- [SQL 如上]

-- ... 其他表 ...

-- 创建索引
-- [SQL 如上]

-- 创建触发器
-- [SQL 如上]

-- 初始化数据
-- [SQL 如上]
```

---

## 表汇总

| 表名 | 说明 | 预估数据量 |
|------|------|-----------|
| user_profiles | 用户资料 | 千级 |
| user_preferences | 用户偏好 | 千级 |
| posts | 帖子 | 万级 |
| comments | 评论 | 万级 |
| announcements | 公告 | 百级 |
| reports | 举报 | 百级 |
| appeals | 申诉 | 百级 |
| suggestions | 建议 | 百级 |
| system_settings | 系统设置 | 十级 |
| post_likes | 帖子点赞（可选） | 万级 |
| comment_likes | 评论点赞（可选） | 万级 |

---

**文档版本**: v1.0  
**创建日期**: 2024-11-30
