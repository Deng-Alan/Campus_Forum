-- 简化的数据库初始化脚本（使用VARCHAR代替UUID）

-- 1. user_profiles 表
CREATE TABLE user_profiles (
    id VARCHAR(36) PRIMARY KEY,
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

-- 2. user_preferences 表
CREATE TABLE user_preferences (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_preferences_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- 3. posts 表
CREATE TABLE posts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
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
    quoted_post_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_posts_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_posts_quoted 
        FOREIGN KEY (quoted_post_id) REFERENCES posts(id) ON DELETE SET NULL
);

-- 4. comments 表
CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    content TEXT NOT NULL,
    author_name VARCHAR(50) NOT NULL,
    likes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_post 
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- 5. announcements 表
CREATE TABLE announcements (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'notice',
    is_top BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. reports 表
CREATE TABLE reports (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_post 
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- 7. appeals 表
CREATE TABLE appeals (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_response TEXT,
    admin_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_appeals_post 
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_appeals_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_appeals_admin 
        FOREIGN KEY (admin_id) REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- 8. suggestions 表
CREATE TABLE suggestions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    content TEXT NOT NULL,
    category VARCHAR(20) NOT NULL DEFAULT 'general',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    admin_response TEXT,
    admin_id VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_suggestions_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_suggestions_admin 
        FOREIGN KEY (admin_id) REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- 9. system_settings 表
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);

-- 插入系统设置
INSERT INTO system_settings (key, value, description) VALUES 
('daily_post_limit', '3', '每日发帖上限'),
('post_content_min_length', '5', '帖子内容最小长度'),
('post_content_max_length', '2000', '帖子内容最大长度');
