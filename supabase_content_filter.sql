-- ========================================
-- 武冈三中校园论坛 - 内容过滤函数
-- ========================================

-- 1. 脏话过滤函数（直接替换为等长星号）
CREATE OR REPLACE FUNCTION replace_bad_words(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  bad_words TEXT[] := ARRAY[
    '操', '傻X', '傻x', '人渣', 'sb', 'SB', '尼玛', '草', '妈的', '他妈', 
    '去死', '垃圾', '废物', '智障', '白痴', '煞笔', '傻逼', '傻比',
    '笨蛋', '蠢货', '贱人', '婊子', '混蛋', '王八蛋', '狗屎', '屁话',
    'cnm', 'nmsl', 'wtf', 'fuck', 'shit', 'damn'
  ];
  word TEXT;
  result TEXT := input_text;
BEGIN
  -- 过滤脏话（替换为等长星号）
  FOREACH word IN ARRAY bad_words LOOP
    result := regexp_replace(result, word, repeat('*', length(word)), 'gi');
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. 敏感内容检测函数
CREATE OR REPLACE FUNCTION check_sensitive_content(input_text TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  sensitive_words TEXT[] := ARRAY[
    '家庭暴力', '校园欺凌', '打架', '早恋', '自残', '自杀',
    '欺凌', '霸凌', '殴打', '威胁', '勒索', '敲诈',
    '跳楼', '割腕', '结束生命', '不想活', '想死',
    '性骚扰', '猥亵', '色情', '裸露'
  ];
  word TEXT;
BEGIN
  FOREACH word IN ARRAY sensitive_words LOOP
    IF input_text ~* word THEN
      RETURN TRUE; -- 检测到敏感内容，返回true表示需要屏蔽
    END IF;
  END LOOP;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 3. 创建触发器函数：在插入帖子时自动过滤内容
CREATE OR REPLACE FUNCTION auto_filter_post_content()
RETURNS TRIGGER AS $$
BEGIN
  -- 检测敏感内容
  IF check_sensitive_content(NEW.content) THEN
    -- 如果包含敏感内容，自动拒绝审核
    NEW.review_status := 'rejected';
    -- 可选：记录敏感内容日志
    RAISE NOTICE '检测到敏感内容，帖子已自动驳回: %', NEW.id;
  ELSE
    -- 如果没有敏感内容，进行脏话过滤
    NEW.content := replace_bad_words(NEW.content);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 为 posts 表创建触发器（在插入和更新时自动执行过滤）
DROP TRIGGER IF EXISTS trigger_filter_post_content ON posts;
CREATE TRIGGER trigger_filter_post_content
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION auto_filter_post_content();

-- 5. 为 comments 表创建类似的过滤（如果有评论表的话）
-- 注意：如果你还没有 comments 表，可以先注释掉这部分
-- CREATE OR REPLACE FUNCTION auto_filter_comment_content()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF check_sensitive_content(NEW.content) THEN
--     RAISE EXCEPTION '该评论包含敏感内容，无法发布';
--   ELSE
--     NEW.content := replace_bad_words(NEW.content);
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- DROP TRIGGER IF EXISTS trigger_filter_comment_content ON comments;
-- CREATE TRIGGER trigger_filter_comment_content
--   BEFORE INSERT OR UPDATE ON comments
--   FOR EACH ROW
--   EXECUTE FUNCTION auto_filter_comment_content();

-- ========================================
-- 使用说明
-- ========================================
-- 1. 在 Supabase SQL Editor 中执行此脚本
-- 2. 触发器会在每次插入或更新帖子时自动执行
-- 3. 如果检测到敏感内容，帖子的 review_status 会自动设为 'rejected'
-- 4. 普通脏话会被自动替换为等长星号（*）

-- 测试示例：
-- SELECT replace_bad_words('这个傻X真是个人渣！'); 
-- 应该返回: '这个**真是个**！'（脏话被替换为等长星号）

-- SELECT check_sensitive_content('有人在校园欺凌我');
-- 应该返回: true（检测到敏感词）
