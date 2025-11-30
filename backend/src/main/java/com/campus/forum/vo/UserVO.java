package com.campus.forum.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户信息 VO
 */
@Data
public class UserVO {

    /**
     * 用户ID
     */
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
     * 手机号 (脱敏)
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
     * 用户角色
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
     * 用户状态
     */
    private Integer status;

    /**
     * 帖子数量
     */
    private Integer postCount;

    /**
     * 获赞数量
     */
    private Integer likeCount;

    /**
     * 粉丝数量
     */
    private Integer followerCount;

    /**
     * 关注数量
     */
    private Integer followingCount;

    /**
     * 注册时间
     */
    private LocalDateTime createdAt;

    /**
     * 最后登录时间
     */
    private LocalDateTime lastLoginAt;
}
