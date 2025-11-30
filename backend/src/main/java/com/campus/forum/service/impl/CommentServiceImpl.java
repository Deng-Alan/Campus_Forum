package com.campus.forum.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.campus.forum.common.ResultCode;
import com.campus.forum.dto.CreateCommentDTO;
import com.campus.forum.entity.Comment;
import com.campus.forum.entity.Post;
import com.campus.forum.entity.UserPreference;
import com.campus.forum.entity.UserProfile;
import com.campus.forum.exception.BusinessException;
import com.campus.forum.mapper.CommentMapper;
import com.campus.forum.mapper.PostMapper;
import com.campus.forum.mapper.UserPreferenceMapper;
import com.campus.forum.mapper.UserProfileMapper;
import com.campus.forum.service.CommentService;
import com.campus.forum.util.RedisUtil;
import com.campus.forum.vo.CommentVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 评论服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommentServiceImpl extends ServiceImpl<CommentMapper, Comment> implements CommentService {

    private final PostMapper postMapper;
    private final UserProfileMapper userProfileMapper;
    private final UserPreferenceMapper userPreferenceMapper;
    private final RedisUtil redisUtil;

    private static final String COMMENT_LIKES_KEY = "forum:comment:likes:";

    @Override
    public Page<CommentVO> getCommentsByPostId(String postId, Integer page, Integer size) {
        Page<Comment> commentPage = new Page<>(page, size);
        LambdaQueryWrapper<Comment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Comment::getPostId, postId)
                .orderByAsc(Comment::getCreatedAt);

        Page<Comment> result = this.page(commentPage, wrapper);

        // 转换为 VO
        Page<CommentVO> voPage = new Page<>(result.getCurrent(), result.getSize(), result.getTotal());
        voPage.setRecords(result.getRecords().stream().map(this::convertToVO).toList());

        return voPage;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createComment(String userId, String postId, CreateCommentDTO createCommentDTO) {
        // 检查帖子是否存在
        Post post = postMapper.selectById(postId);
        if (post == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "帖子不存在");
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

        // 创建评论
        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setUserId(userId);
        comment.setContent(createCommentDTO.getContent());
        comment.setLikes(0);

        // 根据匿名设置决定作者名称
        if (isAnonymous) {
            comment.setAuthorName("匿名用户");
        } else {
            comment.setAuthorName(user.getNickname());
        }

        this.save(comment);

        // 更新帖子评论数（通过数据库触发器自动更新，这里手动更新以保持一致）
        post.setCommentCount(post.getCommentCount() + 1);
        postMapper.updateById(post);

        log.info("用户 {} 评论帖子: {}", userId, postId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteComment(String userId, String commentId) {
        Comment comment = this.getById(commentId);
        if (comment == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "评论不存在");
        }

        // 只能删除自己的评论
        if (!comment.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只能删除自己的评论");
        }

        this.removeById(commentId);

        // 更新帖子评论数
        Post post = postMapper.selectById(comment.getPostId());
        if (post != null) {
            post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
            postMapper.updateById(post);
        }

        log.info("用户 {} 删除评论: {}", userId, commentId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Integer likeComment(String userId, String commentId) {
        Comment comment = this.getById(commentId);
        if (comment == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "评论不存在");
        }

        // 检查是否已点赞（使用 Redis Set）
        String redisKey = COMMENT_LIKES_KEY + commentId;
        Boolean isMember = redisUtil.sIsMember(redisKey, userId);

        if (Boolean.TRUE.equals(isMember)) {
            // 已点赞，则取消点赞
            redisUtil.sRemove(redisKey, userId);
            comment.setLikes(comment.getLikes() - 1);
        } else {
            // 未点赞，则添加点赞
            redisUtil.sAdd(redisKey, userId);
            comment.setLikes(comment.getLikes() + 1);
        }

        this.updateById(comment);
        log.info("用户 {} 点赞评论: {}, 当前点赞数: {}", userId, commentId, comment.getLikes());

        return comment.getLikes();
    }

    @Override
    public CommentVO convertToVO(Comment comment) {
        CommentVO vo = new CommentVO();
        BeanUtils.copyProperties(comment, vo);
        return vo;
    }
}
