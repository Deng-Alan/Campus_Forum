package com.campus.forum.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.campus.forum.entity.Comment;
import com.campus.forum.entity.Post;
import com.campus.forum.mapper.CommentMapper;
import com.campus.forum.mapper.PostMapper;
import com.campus.forum.service.LeaderboardService;
import com.campus.forum.util.RedisUtil;
import com.campus.forum.vo.LeaderboardVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 排行榜服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LeaderboardServiceImpl implements LeaderboardService {

    private final PostMapper postMapper;
    private final CommentMapper commentMapper;
    private final RedisUtil redisUtil;

    private static final String LEADERBOARD_CACHE_KEY = "forum:leaderboard:";

    @Override
    public List<LeaderboardVO> getStudyLeaderboard(Integer days, String subject, Integer limit) {
        if (days == null) {
            days = 7;
        }
        if (limit == null || limit <= 0) {
            limit = 10;
        }

        // 尝试从缓存获取
        String cacheKey = LEADERBOARD_CACHE_KEY + days + ":" + (subject != null ? subject : "all");
        Object cached = null;
        try {
            cached = redisUtil.get(cacheKey);
        } catch (Exception e) {
            // Redis 反序列化等异常时，忽略缓存并重新计算，避免接口整体失败
            log.warn("读取排行榜缓存失败，忽略缓存重新计算，cacheKey={}", cacheKey, e);
            try {
                redisUtil.delete(cacheKey);
            } catch (Exception ignore) {
                // ignore delete error
            }
        }
        if (cached instanceof List) {
            @SuppressWarnings("unchecked")
            List<LeaderboardVO> cachedList = (List<LeaderboardVO>) cached;
            return cachedList.stream().limit(limit).toList();
        }

        // 计算时间范围
        LocalDateTime startTime = LocalDateTime.now().minusDays(days);

        // 查询学习互助类型的帖子
        QueryWrapper<Post> postWrapper = new QueryWrapper<>();
        postWrapper.eq("type", "study_help")
                .eq("review_status", "approved")
                .ge("created_at", startTime);
        if (subject != null && !subject.isEmpty()) {
            postWrapper.eq("subject", subject);
        }
        List<Post> posts = postMapper.selectList(postWrapper);

        // 查询这些帖子的评论
        Set<String> postIds = posts.stream().map(Post::getId).collect(Collectors.toSet());
        List<Comment> comments = new ArrayList<>();
        if (!postIds.isEmpty()) {
            QueryWrapper<Comment> commentWrapper = new QueryWrapper<>();
            commentWrapper.in("post_id", postIds)
                    .ge("created_at", startTime);
            comments = commentMapper.selectList(commentWrapper);
        }

        // 统计每个作者的数据
        Map<String, LeaderboardData> dataMap = new HashMap<>();

        // 统计发帖
        for (Post post : posts) {
            String authorName = post.getAuthorName();
            LeaderboardData data = dataMap.computeIfAbsent(authorName, k -> new LeaderboardData());
            data.postCount++;
            data.totalLikes += post.getLikes();
        }

        // 统计评论
        for (Comment comment : comments) {
            String authorName = comment.getAuthorName();
            LeaderboardData data = dataMap.computeIfAbsent(authorName, k -> new LeaderboardData());
            data.commentCount++;
            data.totalLikes += comment.getLikes();
        }

        // 计算积分并转换为 VO
        List<LeaderboardVO> result = dataMap.entrySet().stream()
                .map(entry -> {
                    String authorName = entry.getKey();
                    LeaderboardData data = entry.getValue();

                    LeaderboardVO vo = new LeaderboardVO();
                    vo.setAuthorName(authorName);
                    vo.setPostCount(data.postCount);
                    vo.setCommentCount(data.commentCount);
                    vo.setTotalLikes(data.totalLikes);

                    // 积分计算规则：发题+2，答题+1，获赞+0.5
                    double score = data.postCount * 2.0 + data.commentCount * 1.0 + data.totalLikes * 0.5;
                    vo.setScore(score);

                    return vo;
                })
                .sorted(Comparator.comparingDouble(LeaderboardVO::getScore).reversed())
                .toList();

        // 设置排名
        for (int i = 0; i < result.size(); i++) {
            result.get(i).setRank(i + 1);
        }

        // 缓存 5 分钟
        redisUtil.set(cacheKey, result, 5, TimeUnit.MINUTES);

        // 返回指定数量
        return result.stream().limit(limit).toList();
    }

    /**
     * 内部数据统计类
     */
    private static class LeaderboardData {
        int postCount = 0;
        int commentCount = 0;
        int totalLikes = 0;
    }
}
