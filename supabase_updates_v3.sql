-- ================================================
-- 武冈三中校园论坛 - v3 增量更新
-- ================================================
-- 功能：添加公告系统和举报系统
-- 创建日期：2025-11-22
-- ================================================

-- 1. 创建公告表
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  is_top BOOLEAN DEFAULT false, -- 是否置顶
  type TEXT DEFAULT 'notice',   -- notice(通知), activity(活动), urgent(紧急)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 开启 RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 公告策略：允许所有人读取，允许所有人修改（配合简易后台）
CREATE POLICY "Public announcements are viewable by everyone" 
ON announcements FOR SELECT USING (true);

CREATE POLICY "Announcements can be managed by everyone" 
ON announcements FOR ALL USING (true);


-- 2. 创建举报表
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,         -- 举报理由
  status TEXT DEFAULT 'pending', -- pending(待处理), resolved(已处理), ignored(已忽略)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 开启 RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 举报策略：允许所有人插入，允许所有人读取/修改（配合简易后台）
CREATE POLICY "Everyone can insert reports" 
ON reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Reports are viewable and manageable by everyone" 
ON reports FOR ALL USING (true);


-- 3. 插入几条默认公告
INSERT INTO announcements (title, content, is_top, type) 
VALUES 
  ('下周一举行期中表彰大会', '请各位同学穿校服准时参加。', true, 'activity'),
  ('图书馆新书上架，欢迎借阅', '本周新增《三体》全集等科幻小说。', false, 'notice'),
  ('本周五下午大扫除', '请各班卫生委员提前安排好任务。', false, 'notice');
