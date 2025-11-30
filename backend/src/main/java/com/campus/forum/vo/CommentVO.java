package com.campus.forum.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 评论响应 VO
 */
@Data
public class CommentVO {

    /**
     * 评论ID
     */
    private String id;

    /**
     * 帖子ID
     */
    private String postId;

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
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime createdAt;
}
