package com.campus.forum.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * comments 表实体
 */
@Data
@TableName("comments")
public class Comment {

    /**
     * 评论唯一标识（UUID 字符串）
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 所属帖子ID
     */
    private String postId;

    /**
     * 评论用户ID（可为空）
     */
    private String userId;

    /**
     * 评论内容
     */
    private String content;

    /**
     * 作者显示名称
     */
    private String authorName;

    /**
     * 点赞数
     */
    private Integer likes;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
}
