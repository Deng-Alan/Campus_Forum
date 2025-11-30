package com.campus.forum.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * user_profiles 表实体
 */
@Data
@TableName("user_profiles")
public class UserProfile {

    /**
     * 用户唯一标识（UUID 字符串）
     */
    @TableId(type = IdType.ASSIGN_UUID)
    private String id;

    /**
     * 用户名
     */
    private String username;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 密码哈希（BCrypt）
     */
    private String passwordHash;

    /**
     * 头像 URL
     */
    private String avatar;

    /**
     * 角色：user/admin
     */
    private String role;

    /**
     * 状态：active/banned/deleted
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
