package com.campus.forum.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * suggestions 表实体
 */
@Data
@TableName("suggestions")
public class Suggestion {

    /**
     * 建议唯一标识（UUID 字符串）
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 提交人ID（可匿名）
     */
    private String userId;

    /**
     * 建议内容
     */
    private String content;

    /**
     * 建议类别：general, feature, bug, improvement
     */
    private String category;

    /**
     * 处理状态：pending, reviewing, accepted, rejected, implemented
     */
    private String status;

    /**
     * 是否匿名提交
     */
    private Boolean isAnonymous;

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
