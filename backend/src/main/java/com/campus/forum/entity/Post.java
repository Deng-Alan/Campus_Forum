package com.campus.forum.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * posts 表实体
 */
@Data
@TableName("posts")
public class Post {

    /**
     * 帖子唯一标识（UUID 字符串）
     */
    @TableId(type = IdType.INPUT)
    private String id;

    /**
     * 发帖用户ID（可为空，用于匿名）
     */
    private String userId;

    /**
     * 帖子内容
     */
    private String content;

    /**
     * 作者显示名称
     */
    private String authorName;

    /**
     * 发帖时的头像快照
     */
    private String avatarUrl;

    /**
     * 帖子类型：campus_fun, study_help, confession, anonymous
     */
    private String type;

    /**
     * 学科（仅 study_help 类型）
     */
    private String subject;

    /**
     * 图片 URL
     */
    private String imageUrl;

    /**
     * 点赞数
     */
    private Integer likes;

    /**
     * 评论数（冗余字段）
     */
    private Integer commentCount;

    /**
     * 是否精选
     */
    private Boolean isFeatured;

    /**
     * 审核状态：pending, approved, rejected
     */
    private String reviewStatus;

    /**
     * 帖子状态：pending, approved, rejected, removed
     */
    private String status;

    /**
     * 引用的帖子 ID
     */
    private String quotedPostId;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
