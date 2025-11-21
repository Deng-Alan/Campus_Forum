-- 1. 修改 posts 表结构
-- 添加新列
alter table public.posts 
add column if not exists type text not null default 'anonymous', -- 帖子类型
add column if not exists student_id text, -- 学号 (用于防刷屏)
add column if not exists image_url text, -- 图片链接
add column if not exists subject text, -- 学科
add column if not exists is_best_answer boolean default false, -- 是否最佳答案
add column if not exists is_featured boolean default false; -- 是否精选

-- 2. 创建脏话替换函数 (参考 PRD)
CREATE OR REPLACE FUNCTION replace_bad_words(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  bad_words TEXT[] := ARRAY['操', '傻X', '人渣', 'sb', '尼玛', '草', '滚', '智障'];
  friendly_replace JSONB := '[{"from":"约会","to":"一起吃食堂"},{"from":"人渣","to":"不太友善"},{"from":"打架","to":"切磋武艺"},{"from":"早恋","to":"青春期懵懂"}]';
  word TEXT;
  result TEXT := input_text;
  replace_item JSONB;
BEGIN
  -- 过滤脏话
  FOREACH word IN ARRAY bad_words LOOP
    result := regexp_replace(result, word, repeat('*', length(word)), 'gi');
  END LOOP;

  -- 友好词替换
  FOR replace_item IN SELECT * FROM jsonb_array_elements(friendly_replace) LOOP
    result := regexp_replace(
      result,
      (replace_item->>'from')::TEXT,
      (replace_item->>'to')::TEXT,
      'gi'
    );
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. 创建敏感内容检查函数 (参考 PRD)
CREATE OR REPLACE FUNCTION check_sensitive_content(input_text TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  sensitive_words TEXT[] := ARRAY['家庭暴力', '校园欺凌', '自残', '自杀', '毒品', '赌博'];
  word TEXT;
BEGIN
  FOREACH word IN ARRAY sensitive_words LOOP
    IF input_text ~* word THEN
      RETURN TRUE; -- 检测到敏感内容
    END IF;
  END LOOP;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器：在插入或更新帖子时自动清洗内容
CREATE OR REPLACE FUNCTION trigger_clean_post_content()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. 检查是否包含极其敏感的内容，如果有则禁止发布 (抛出错误)
  IF check_sensitive_content(NEW.content) THEN
    RAISE EXCEPTION '内容包含敏感信息（如家庭暴力、校园欺凌等），无法发布。请寻求老师或家长的帮助。';
  END IF;

  -- 2. 替换脏话和应用友好词
  NEW.content := replace_bad_words(NEW.content);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 先删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_post_created_clean_content ON public.posts;

-- 绑定触发器
CREATE TRIGGER on_post_created_clean_content
BEFORE INSERT OR UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION trigger_clean_post_content();

-- 5. 索引优化 (参考 PRD)
create index if not exists idx_posts_type on public.posts(type);
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_posts_featured on public.posts(is_featured) where is_featured = true;
