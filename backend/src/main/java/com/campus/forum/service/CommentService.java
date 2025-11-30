package com.campus.forum.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.campus.forum.dto.CreateCommentDTO;
import com.campus.forum.entity.Comment;
import com.campus.forum.vo.CommentVO;

/**
 * 评论服务接口
 */
public interface CommentService extends IService<Comment> {

    /**
     * 分页查询帖子评论列表
     *
     * @param postId 帖子ID
     * @param page   页码
     * @param size   每页数量
     * @return 分页结果
     */
    Page<CommentVO> getCommentsByPostId(String postId, Integer page, Integer size);

    /**
     * 创建评论
     *
     * @param userId           当前用户ID
     * @param postId           帖子ID
     * @param createCommentDTO 创建评论DTO
     */
    void createComment(String userId, String postId, CreateCommentDTO createCommentDTO);

    /**
     * 删除评论
     *
     * @param userId    当前用户ID
     * @param commentId 评论ID
     */
    void deleteComment(String userId, String commentId);

    /**
     * 点赞评论
     *
     * @param userId    当前用户ID
     * @param commentId 评论ID
     * @return 点赞后的点赞数
     */
    Integer likeComment(String userId, String commentId);

    /**
     * 将 Comment 实体转换为 CommentVO
     *
     * @param comment Comment实体
     * @return CommentVO
     */
    CommentVO convertToVO(Comment comment);
}
