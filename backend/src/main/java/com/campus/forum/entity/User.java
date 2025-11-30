package com.campus.forum.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 用户实体类
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("users")
public class User extends BaseEntity {

    /**
     * 用户名
     */
    private String username;

    /**
     * 密码 (BCrypt 加密)
     */
    private String password;

    /**
     * 昵称
     */
    private String nickname;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 手机号
     */
    private String phone;

    /**
     * 头像URL
     */
    private String avatar;

    /**
     * 个人简介
     */
    private String bio;

    /**
     * 用户角色: student(学生), teacher(教师), admin(管理员)
     */
    private String role;

    /**
     * 年级
     */
    private String grade;

    /**
     * 班级
     */
    private String classNumber;

    /**
     * 用户状态: 0-禁用, 1-正常, 2-待审核
     */
    private Integer status;

    /**
     * 最后登录时间
     */
    private LocalDateTime lastLoginAt;

    /**
     * 最后登录IP
     */
    private String lastLoginIp;

    /**
     * 帖子数量 (冗余字段，定期同步)
     */
    @TableField(exist = false)
    private Integer postCount;

    /**
     * 获赞数量 (冗余字段，定期同步)
     */
    @TableField(exist = false)
    private Integer likeCount;

    /**
     * 粉丝数量 (冗余字段，定期同步)
     */
    @TableField(exist = false)
    private Integer followerCount;
}
