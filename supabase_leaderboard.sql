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

CREATE OR REPLACE FUNCTION get_study_leaderboard(days_limit INT DEFAULT 7)
RETURNS TABLE (
  author_name TEXT,
  post_count BIGINT,
  comment_count BIGINT,
  total_likes BIGINT,
  score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH study_posts AS (
    -- 统计学习互助帖子
    SELECT 
      p.author_name,
      COUNT(p.id) as post_count,
      SUM(p.likes) as post_likes
    FROM posts p
    WHERE p.type = 'study_help'
      AND p.created_at >= NOW() - INTERVAL '1 day' * days_limit
    GROUP BY p.author_name
  ),
  study_comments AS (
    -- 统计学习互助帖子下的评论
    SELECT 
      c.author_name,
      COUNT(c.id) as comment_count,
      SUM(c.likes) as comment_likes
    FROM comments c
    INNER JOIN posts p ON p.id = c.post_id
    WHERE p.type = 'study_help'
      AND c.created_at >= NOW() - INTERVAL '1 day' * days_limit
    GROUP BY c.author_name
  ),
  combined_stats AS (
    -- 合并帖子和评论统计
    SELECT 
      COALESCE(sp.author_name, sc.author_name) as author_name,
      COALESCE(sp.post_count, 0) as post_count,
      COALESCE(sc.comment_count, 0) as comment_count,
      COALESCE(sp.post_likes, 0) + COALESCE(sc.comment_likes, 0) as total_likes
    FROM study_posts sp
    FULL OUTER JOIN study_comments sc ON sp.author_name = sc.author_name
  )
  SELECT 
    cs.author_name,
    cs.post_count,
    cs.comment_count,
    cs.total_likes,
    -- 计算总分：发帖 * 2 + 回复 * 1 + 点赞 * 0.5
    (cs.post_count * 2 + cs.comment_count * 1 + cs.total_likes * 0.5)::NUMERIC as score
  FROM combined_stats cs
  WHERE cs.author_name IS NOT NULL
    AND cs.author_name NOT IN ('匿名同学', '某位同学') -- 排除匿名用户
  ORDER BY score DESC, cs.post_count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 2. 测试函数
-- ================================================
-- 查询最近 7 天的学霸排行榜
-- SELECT * FROM get_study_leaderboard(7);

-- 查询最近 30 天的学霸排行榜
-- SELECT * FROM get_study_leaderboard(30);

-- ================================================
-- 3. 创建物化视图（可选，用于性能优化）
-- ================================================
-- 如果数据量大，可以创建物化视图定期刷新
-- CREATE MATERIALIZED VIEW study_leaderboard_7days AS
-- SELECT * FROM get_study_leaderboard(7);

-- 刷新物化视图（需要定期执行，可以设置 cron job）
-- REFRESH MATERIALIZED VIEW study_leaderboard_7days;
