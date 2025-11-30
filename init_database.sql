-- ================================================
-- 校园论坛数据库初始化脚本
-- 数据库: PostgreSQL 16+
-- 创建日期: 2024-11-30
-- ================================================

-- 启用 UUID 扩展（如果还没启用）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================
-- 1. 用户资料表 (user_profiles)
-- ================================================
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
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_profiles_role CHECK (role IN ('user', 'admin')),
    CONSTRAINT chk_user_profiles_status CHECK (status IN ('active', 'banned', 'deleted'))
);

COMMENT ON TABLE user_profiles IS '用户资料表';
COMMENT ON COLUMN user_profiles.id IS '用户唯一标识';
COMMENT ON COLUMN user_profiles.username IS '用户名（3-20字符，字母数字下划线）';
COMMENT ON COLUMN user_profiles.nickname IS '昵称（2-20字符）';
COMMENT ON COLUMN user_profiles.email IS '邮箱地址';
COMMENT ON COLUMN user_profiles.password_hash IS '密码哈希值（BCrypt）';
COMMENT ON COLUMN user_profiles.avatar IS '头像URL';
COMMENT ON COLUMN user_profiles.role IS '角色：user-普通用户，admin-管理员';
COMMENT ON COLUMN user_profiles.status IS '状态：active-正常，banned-封禁，deleted-注销';

-- ================================================
-- 2. 用户偏好设置表 (user_preferences)
-- ================================================
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

-- ================================================
-- 3. 帖子表 (posts)
-- ================================================
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

-- ================================================
-- 4. 评论表 (comments)
-- ================================================
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

-- ================================================
-- 5. 公告表 (announcements)
-- ================================================
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

-- ================================================
-- 6. 举报表 (reports)
-- ================================================
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

-- ================================================
-- 7. 申诉表 (appeals)
-- ================================================
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

-- ================================================
-- 8. 建议反馈表 (suggestions)
-- ================================================
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

-- ================================================
-- 9. 系统设置表 (system_settings)
-- ================================================
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE system_settings IS '系统设置表';

-- ================================================
-- 10. 帖子点赞记录表 (post_likes) - 防止重复点赞
-- ================================================
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

-- ================================================
-- 11. 评论点赞记录表 (comment_likes) - 防止重复点赞
-- ================================================
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

-- ================================================
-- 索引创建
-- ================================================

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

-- ================================================
-- 触发器：自动更新 updated_at 字段
-- ================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表创建触发器
CREATE TRIGGER trigger_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
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

CREATE TRIGGER trigger_system_settings_updated_at
BEFORE UPDATE ON system_settings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ================================================
-- 触发器：评论数自动更新
-- ================================================
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

CREATE OR REPLACE FUNCTION update_post_comment_count_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0), updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_delete
AFTER DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comment_count_on_delete();

-- ================================================
-- 触发器：点赞数自动更新（帖子）
-- ================================================
CREATE OR REPLACE FUNCTION update_post_likes_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts SET likes = likes + 1 WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_like_insert
AFTER INSERT ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_on_insert();

CREATE OR REPLACE FUNCTION update_post_likes_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE posts SET likes = GREATEST(likes - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_like_delete
AFTER DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_on_delete();

-- ================================================
-- 触发器：点赞数自动更新（评论）
-- ================================================
CREATE OR REPLACE FUNCTION update_comment_likes_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE comments SET likes = likes + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_like_insert
AFTER INSERT ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_on_insert();

CREATE OR REPLACE FUNCTION update_comment_likes_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE comments SET likes = GREATEST(likes - 1, 0) WHERE id = OLD.comment_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_like_delete
AFTER DELETE ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_on_delete();

-- ================================================
-- 初始化数据
-- ================================================

-- 创建管理员账户
-- 账号: AlanDeng
-- 密码: dwb918112 (BCrypt 加密)
-- 邮箱: alandeng@admin.com
INSERT INTO user_profiles (id, username, nickname, email, password_hash, role) VALUES 
(gen_random_uuid(), 'AlanDeng', '管理员', 'alandeng@admin.com', 
 '$2a$10$EqKcp1WnNf6g5U2p6E8pxOhZ3FvwX4YwTqZhJ9N8WvL5sR7dG1mKe', 'admin');

-- 系统设置初始化
INSERT INTO system_settings (key, value, description) VALUES 
('daily_post_limit', '3', '每日发帖上限'),
('post_content_min_length', '5', '帖子内容最小长度'),
('post_content_max_length', '2000', '帖子内容最大长度'),
('comment_content_max_length', '500', '评论内容最大长度'),
('enable_auto_review', 'false', '是否开启自动审核'),
('sensitive_words', '', '敏感词列表（逗号分隔）');

-- 示例公告
INSERT INTO announcements (title, content, type, is_top) VALUES 
('欢迎来到武冈三中校园论坛！', '这是一个属于我们自己的校园交流平台，请文明发言，共同维护良好的社区氛围！', 'notice', true),
('论坛使用须知', '1. 请勿发布违规内容\n2. 尊重他人，文明交流\n3. 每日发帖上限为3条\n4. 学习互助板块可获得排行榜积分', 'notice', false);

-- ================================================
-- 完成提示
-- ================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '校园论坛数据库初始化完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '创建表: 11 张';
    RAISE NOTICE '创建索引: 20+ 个';
    RAISE NOTICE '创建触发器: 12 个';
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE '默认管理员账号: AlanDeng';
    RAISE NOTICE '默认管理员密码: dwb918112';
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE '请及时修改管理员密码！';
    RAISE NOTICE '========================================';
END $$;
