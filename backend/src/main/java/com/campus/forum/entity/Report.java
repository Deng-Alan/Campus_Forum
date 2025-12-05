package com.campus.forum.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * reports 表实体
 */
@Data
@TableName("reports")
public class Report {

    /**
     * 举报唯一标识（UUID 字符串）
     */
    @TableId(type = IdType.INPUT)
    private String id;

    /**
     * 被举报的帖子ID
     */
    private String postId;

    /**
     * 举报人ID（可匿名）
     */
    private String userId;

    /**
     * 举报理由
     */
    private String reason;

    /**
     * 处理状态：pending, resolved, ignored
     */
    private String status;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
