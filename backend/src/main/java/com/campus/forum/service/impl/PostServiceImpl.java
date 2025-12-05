package com.campus.forum.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.campus.forum.common.ResultCode;
import com.campus.forum.dto.CreatePostDTO;
import com.campus.forum.entity.Post;
import com.campus.forum.entity.UserPreference;
import com.campus.forum.entity.UserProfile;
import com.campus.forum.exception.BusinessException;
import com.campus.forum.mapper.PostMapper;
import com.campus.forum.mapper.SystemSettingMapper;
import com.campus.forum.mapper.UserPreferenceMapper;
import com.campus.forum.mapper.UserProfileMapper;
import com.campus.forum.service.PostService;
import com.campus.forum.util.RedisUtil;
import com.campus.forum.vo.PostVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 帖子服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PostServiceImpl extends ServiceImpl<PostMapper, Post> implements PostService {

    private final UserProfileMapper userProfileMapper;
    private final UserPreferenceMapper userPreferenceMapper;
    private final SystemSettingMapper systemSettingMapper;
    private final RedisUtil redisUtil;

    private static final String DAILY_POST_COUNT_KEY = "forum:daily:post:";
    private static final String POST_LIKES_KEY = "forum:post:likes:";

    @Override
    public Page<PostVO> getPostList(Integer page, Integer size, String type, String subject, String reviewStatus) {
        // 默认只查询已审核通过的帖子
        if (reviewStatus == null) {
            reviewStatus = "approved";
        }

        Page<Post> postPage = new Page<>(page, size);
        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Post::getReviewStatus, reviewStatus);

        if (type != null && !type.isEmpty()) {
            wrapper.eq(Post::getType, type);
        }
        if (subject != null && !subject.isEmpty()) {
            wrapper.eq(Post::getSubject, subject);
        }

        // 精选帖子优先，然后按创建时间倒序
        wrapper.orderByDesc(Post::getIsFeatured, Post::getCreatedAt);

        Page<Post> result = this.page(postPage, wrapper);

        // 转换为 VO
        Page<PostVO> voPage = new Page<>(result.getCurrent(), result.getSize(), result.getTotal());
        voPage.setRecords(result.getRecords().stream().map(this::convertToVO).toList());

        return voPage;
    }

    @Override
    public PostVO getPostDetail(String postId) {
        Post post = this.getById(postId);
        if (post == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "帖子不存在");
        }
        return convertToVO(post);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Map<String, Object> createPost(String userId, CreatePostDTO createPostDTO) {
        // 获取系统设置的每日发帖上限，查不到时使用默认值 3
        int dailyLimit = 3;
        try {
            var setting = systemSettingMapper.selectById("daily_post_limit");
            if (setting != null && setting.getValue() != null && !setting.getValue().isEmpty()) {
                dailyLimit = Integer.parseInt(setting.getValue());
            } else {
                log.warn("system_settings 中缺少 daily_post_limit 配置或值为空，使用默认值 {}", dailyLimit);
            }
        } catch (Exception e) {
            log.warn("读取 daily_post_limit 配置失败，使用默认值 {}", dailyLimit, e);
        }

        // 检查今日发帖数（Redis 不可用时降级为 0）
        String today = LocalDate.now().toString();
        String redisKey = DAILY_POST_COUNT_KEY + userId + ":" + today;
        Integer count = 0;
        try {
            count = (Integer) redisUtil.get(redisKey);
            if (count == null) {
                count = 0;
            }
        } catch (Exception e) {
            log.warn("读取 Redis 发帖计数失败，使用默认值 0，key={}", redisKey, e);
            count = 0;
        }

        if (count >= dailyLimit) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "今日发帖数已达上限（" + dailyLimit + "篇）");
        }

        // 获取用户信息
        UserProfile user = userProfileMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 检查用户偏好（是否匿名）
        UserPreference preference = userPreferenceMapper.selectOne(
                new LambdaQueryWrapper<UserPreference>().eq(UserPreference::getUserId, userId)
        );
        boolean isAnonymous = preference != null && preference.getIsAnonymous();

        // 创建帖子
        Post post = new Post();
        post.setId(IdUtil.simpleUUID());
        post.setUserId(userId);
        post.setContent(createPostDTO.getContent());
        post.setType(createPostDTO.getType());
        post.setSubject(createPostDTO.getSubject());
        post.setImageUrl(createPostDTO.getImageUrl());
        post.setQuotedPostId(createPostDTO.getQuotedPostId());
        post.setLikes(0);
        post.setCommentCount(0);
        post.setIsFeatured(false);
        post.setReviewStatus("pending");
        post.setStatus("pending");

        // 根据匿名设置决定作者名称
        if (isAnonymous || "anonymous".equals(createPostDTO.getType())) {
            post.setAuthorName("匿名用户");
            post.setAvatarUrl(null);
        } else {
            post.setAuthorName(user.getNickname());
            post.setAvatarUrl(user.getAvatar());
        }

        this.save(post);

        // 增加今日发帖计数
        count++;
        // 设置过期时间到今天 23:59:59（Redis 不可用时仅记录日志，不影响主流程）
        long secondsUntilMidnight = 86400 - (System.currentTimeMillis() / 1000 % 86400);
        try {
            redisUtil.set(redisKey, count, secondsUntilMidnight, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("更新 Redis 发帖计数失败，key={}, value={}", redisKey, count, e);
        }

        log.info("用户 {} 发布帖子: {}", userId, post.getId());

        // 返回结果
        Map<String, Object> result = new HashMap<>();
        result.put("id", post.getId());
        result.put("dailyPostCount", count);
        result.put("dailyPostLimit", dailyLimit);

        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePost(String userId, String postId) {
        Post post = this.getById(postId);
        if (post == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "帖子不存在");
        }

        // 只能删除自己的帖子
        if (!post.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只能删除自己的帖子");
        }

        this.removeById(postId);
        log.info("用户 {} 删除帖子: {}", userId, postId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer likePost(String userId, String postId) {
        Post post = this.getById(postId);
        if (post == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "帖子不存在");
        }

        // 检查是否已点赞（使用 Redis Set）
        String redisKey = POST_LIKES_KEY + postId;
        Boolean isMember = null;
        try {
            isMember = redisUtil.sIsMember(redisKey, userId);
        } catch (Exception e) {
            log.warn("检查帖子点赞状态时访问 Redis 失败，降级为无操作，key={}, userId={}", redisKey, userId, e);
        }

        if (isMember == null) {
            return post.getLikes();
        }

        if (Boolean.TRUE.equals(isMember)) {
            // 已点赞，则取消点赞
            try {
                redisUtil.sRemove(redisKey, userId);
            } catch (Exception e) {
                log.warn("取消帖子点赞时访问 Redis 失败，key={}, userId={}", redisKey, userId, e);
            }
            post.setLikes(Math.max(0, post.getLikes() - 1));
        } else {
            // 未点赞，则添加点赞
            try {
                redisUtil.sAdd(redisKey, userId);
            } catch (Exception e) {
                log.warn("添加帖子点赞时访问 Redis 失败，key={}, userId={}", redisKey, userId, e);
            }
            post.setLikes(post.getLikes() + 1);
        }

        this.updateById(post);
        log.info("用户 {} 点赞帖子: {}, 当前点赞数: {}", userId, postId, post.getLikes());

        return post.getLikes();
    }

    @Override
    public Page<PostVO> getMyPosts(String userId, Integer page, Integer size) {
        Page<Post> postPage = new Page<>(page, size);
        LambdaQueryWrapper<Post> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Post::getUserId, userId)
                .orderByDesc(Post::getCreatedAt);

        Page<Post> result = this.page(postPage, wrapper);

        // 转换为 VO
        Page<PostVO> voPage = new Page<>(result.getCurrent(), result.getSize(), result.getTotal());
        voPage.setRecords(result.getRecords().stream().map(this::convertToVO).toList());

        return voPage;
    }

    @Override
    public PostVO convertToVO(Post post) {
        PostVO vo = new PostVO();
        BeanUtils.copyProperties(post, vo);

        // 如果有引用帖子，查询并填充简化信息
        if (post.getQuotedPostId() != null) {
            Post quotedPost = this.getById(post.getQuotedPostId());
            if (quotedPost != null) {
                PostVO.QuotedPostVO quotedVO = new PostVO.QuotedPostVO();
                quotedVO.setId(quotedPost.getId());
                quotedVO.setContent(quotedPost.getContent());
                quotedVO.setAuthorName(quotedPost.getAuthorName());
                vo.setQuotedPost(quotedVO);
            }
        }

        return vo;
    }
}
