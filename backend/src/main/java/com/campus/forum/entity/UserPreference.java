package com.campus.forum.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * user_preferences 表实体
 */
@Data
@TableName("user_preferences")
public class UserPreference {

    /**
     * 主键（UUID 字符串）
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 关联用户 ID（user_profiles.id）
     */
    private String userId;

    /**
     * 是否匿名模式
     */
    private Boolean isAnonymous;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
