package com.campus.forum.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 帖子响应 VO
 */
@Data
public class PostVO {

    /**
     * 帖子ID
     */
    private String id;

    /**
     * 帖子内容
     */
    private String content;

    /**
     * 作者显示名称
     */
    private String authorName;

    /**
     * 作者头像URL
     */
    private String avatarUrl;

    /**
     * 帖子类型
     */
    private String type;

    /**
     * 学科
     */
    private String subject;

    /**
     * 图片URL
     */
    private String imageUrl;

    /**
     * 点赞数
     */
    private Integer likes;

    /**
     * 评论数
     */
    private Integer commentCount;

    /**
     * 是否精选
     */
    private Boolean isFeatured;

    /**
     * 审核状态
     */
    private String reviewStatus;

    /**
     * 帖子状态
     */
    private String status;

    /**
     * 引用的帖子（简化信息）
     */
    private QuotedPostVO quotedPost;

    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime createdAt;

    /**
     * 引用的帖子简化 VO
     */
    @Data
    public static class QuotedPostVO {
        private String id;
        private String content;
        private String authorName;
    }
}
