-- 创建评论表 (comments)
create table if not exists public.comments (
  id uuid not null default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  content text not null,
  author_name text not null default '匿名同学',
  created_at timestamp with time zone not null default now(),
  likes integer not null default 0,
  constraint comments_pkey primary key (id)
);

-- 开启 RLS
alter table public.comments enable row level security;

-- 创建访问策略
create policy "Enable read access for all users"
on public.comments
for select
to public
using (true);

create policy "Enable insert for all users"
on public.comments
for insert
to public
with check (true);

create policy "Enable delete for all users"
on public.comments
for delete
to public
using (true);

create policy "Enable update for all users"
on public.comments
for update
to public
using (true)
with check (true);

-- 创建索引优化查询
create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_comments_created_at on public.comments(created_at desc);

-- 创建评论点赞函数
create or replace function increment_comment_likes (comment_id uuid)
returns void
language sql
security definer
as $$
  update public.comments
  set likes = likes + 1
  where id = comment_id;
$$;

-- 为评论内容也添加过滤触发器
CREATE OR REPLACE FUNCTION trigger_clean_comment_content()
RETURNS TRIGGER AS $$
BEGIN
  -- 检查敏感内容
  IF check_sensitive_content(NEW.content) THEN
    RAISE EXCEPTION '内容包含敏感信息，无法发布。';
  END IF;

  -- 替换脏话和应用友好词
  NEW.content := replace_bad_words(NEW.content);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 绑定触发器
DROP TRIGGER IF EXISTS on_comment_created_clean_content ON public.comments;

CREATE TRIGGER on_comment_created_clean_content
BEFORE INSERT OR UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION trigger_clean_comment_content();
