package com.campus.forum.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.campus.forum.entity.User;
import com.campus.forum.vo.UserVO;

/**
 * 用户服务接口
 */
public interface UserService extends IService<User> {

    /**
     * 根据用户名获取用户
     *
     * @param username 用户名
     * @return 用户信息
     */
    User getByUsername(String username);

    /**
     * 根据邮箱获取用户
     *
     * @param email 邮箱
     * @return 用户信息
     */
    User getByEmail(String email);

    /**
     * 获取用户详情 VO
     *
     * @param userId 用户ID
     * @return 用户详情 VO
     */
    UserVO getUserDetail(Long userId);

    /**
     * 更新用户信息
     *
     * @param userId 用户ID
     * @param userVO 用户信息
     */
    void updateUserInfo(Long userId, UserVO userVO);

    /**
     * 修改密码
     *
     * @param userId      用户ID
     * @param oldPassword 旧密码
     * @param newPassword 新密码
     */
    void changePassword(Long userId, String oldPassword, String newPassword);

    /**
     * 更新用户登录信息
     *
     * @param userId 用户ID
     * @param ip     登录IP
     */
    void updateLoginInfo(Long userId, String ip);
}
