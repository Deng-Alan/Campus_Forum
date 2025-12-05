package com.campus.forum.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * appeals 表实体
 */
@Data
@TableName("appeals")
public class Appeal {

    /**
     * 申诉唯一标识（UUID 字符串）
     */
    @TableId(type = IdType.INPUT)
    private String id;

    /**
     * 申诉的帖子ID
     */
    private String postId;

    /**
     * 申诉人ID
     */
    private String userId;

    /**
     * 申诉理由
     */
    private String reason;

    /**
     * 处理状态：pending, approved, rejected
     */
    private String status;

    /**
     * 管理员回复
     */
    private String adminResponse;

    /**
     * 处理的管理员ID
     */
    private String adminId;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
