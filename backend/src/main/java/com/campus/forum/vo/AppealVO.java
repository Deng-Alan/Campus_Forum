package com.campus.forum.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 申诉响应 VO
 */
@Data
public class AppealVO {

    /**
     * 申诉ID
     */
    private String id;

    /**
     * 申诉的帖子ID
     */
    private String postId;

    /**
     * 申诉理由
     */
    private String reason;

    /**
     * 处理状态
     */
    private String status;

    /**
     * 管理员回复
     */
    private String adminResponse;

    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime updatedAt;
}
