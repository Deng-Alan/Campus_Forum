-- ================================================
-- 武冈三中校园论坛 - 学霸排行榜统计
-- ================================================
-- 功能：统计学习互助板块的用户贡献，生成学霸排行榜
-- 创建日期：2025-11-21
-- ================================================

-- ================================================
-- 1. 创建学霸排行榜统计函数
-- ================================================
-- 统计规则：
-- - 发布学习互助帖子：+2 分
-- - 回复学习互助帖子：+1 分
-- - 获得点赞：+0.5 分
-- - 按周统计（最近 7 天）
-- ================================================

CREATE OR REPLACE FUNCTION get_study_leaderboard(
  days_limit INT DEFAULT 7,
  subject_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  author_name TEXT,
  post_count BIGINT,
  comment_count BIGINT,
  total_likes BIGINT,
  score NUMERIC
) AS $$
DECLARE
  comments_table_exists BOOLEAN;
BEGIN
  -- 检查 comments 表是否存在
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'comments'
  ) INTO comments_table_exists;

  -- 如果 comments 表不存在，只统计帖子
  IF NOT comments_table_exists THEN
    RETURN QUERY
    SELECT 
      p.author_name::TEXT,
      COUNT(p.id)::BIGINT as post_count,
      0::BIGINT as comment_count,
      COALESCE(SUM(p.likes), 0)::BIGINT as total_likes,
      (COUNT(p.id) * 2 + COALESCE(SUM(p.likes), 0) * 0.5)::NUMERIC as score
    FROM posts p
    WHERE p.type = 'study_help'
      AND p.review_status = 'approved'
      AND p.created_at >= NOW() - INTERVAL '1 day' * days_limit
      AND (subject_filter IS NULL OR p.subject = subject_filter)
      AND p.author_name IS NOT NULL
      AND p.author_name NOT IN ('匿名同学', '某位同学')
    GROUP BY p.author_name
    ORDER BY score DESC, post_count DESC
    LIMIT 10;
    RETURN;
  END IF;

  -- 正常统计（包含评论）
  RETURN QUERY
  WITH study_posts AS (
    SELECT 
      p.author_name,
      COUNT(p.id)::BIGINT as post_count,
      COALESCE(SUM(p.likes), 0)::BIGINT as post_likes
    FROM posts p
    WHERE p.type = 'study_help'
      AND p.review_status = 'approved'
      AND p.created_at >= NOW() - INTERVAL '1 day' * days_limit
      AND (subject_filter IS NULL OR p.subject = subject_filter)
    GROUP BY p.author_name
  ),
  study_comments AS (
    SELECT 
      c.author_name,
      COUNT(c.id)::BIGINT as comment_count,
      COALESCE(SUM(c.likes), 0)::BIGINT as comment_likes
    FROM comments c
    INNER JOIN posts p ON p.id = c.post_id
    WHERE p.type = 'study_help'
      AND p.review_status = 'approved'
      AND c.created_at >= NOW() - INTERVAL '1 day' * days_limit
      AND (subject_filter IS NULL OR p.subject = subject_filter)
    GROUP BY c.author_name
  ),
  combined_stats AS (
    SELECT 
      COALESCE(sp.author_name, sc.author_name) as author_name,
      COALESCE(sp.post_count, 0)::BIGINT as post_count,
      COALESCE(sc.comment_count, 0)::BIGINT as comment_count,
      (COALESCE(sp.post_likes, 0) + COALESCE(sc.comment_likes, 0))::BIGINT as total_likes
    FROM study_posts sp
    FULL OUTER JOIN study_comments sc ON sp.author_name = sc.author_name
  )
  SELECT 
    cs.author_name::TEXT,
    cs.post_count::BIGINT,
    cs.comment_count::BIGINT,
    cs.total_likes::BIGINT,
    (cs.post_count * 2 + cs.comment_count * 1 + cs.total_likes * 0.5)::NUMERIC as score
  FROM combined_stats cs
  WHERE cs.author_name IS NOT NULL
    AND cs.author_name NOT IN ('匿名同学', '某位同学')
  ORDER BY score DESC, cs.post_count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 2. 测试函数
-- ================================================
-- 查询最近 7 天的学霸排行榜（全部学科）
-- SELECT * FROM get_study_leaderboard(7);

-- 查询最近 7 天的数学学霸排行榜
-- SELECT * FROM get_study_leaderboard(7, '数学');

-- 查询最近 7 天的物理学霸排行榜
-- SELECT * FROM get_study_leaderboard(7, '物理');

-- 查询最近 30 天的化学学霸排行榜
-- SELECT * FROM get_study_leaderboard(30, '化学');

-- ================================================
-- 3. 创建物化视图（可选，用于性能优化）
-- ================================================
-- 如果数据量大，可以创建物化视图定期刷新
-- CREATE MATERIALIZED VIEW study_leaderboard_7days AS
-- SELECT * FROM get_study_leaderboard(7);

-- 刷新物化视图（需要定期执行，可以设置 cron job）
-- REFRESH MATERIALIZED VIEW study_leaderboard_7days;
