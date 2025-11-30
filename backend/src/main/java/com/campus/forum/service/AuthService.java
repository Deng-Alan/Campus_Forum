package com.campus.forum.service;

import com.campus.forum.dto.LoginDTO;
import com.campus.forum.dto.RegisterDTO;
import com.campus.forum.vo.LoginVO;

/**
 * 认证服务接口
 */
public interface AuthService {

    /**
     * 用户登录
     *
     * @param loginDTO 登录信息
     * @return 登录结果
     */
    LoginVO login(LoginDTO loginDTO);

    /**
     * 用户注册
     *
     * @param registerDTO 注册信息
     */
    void register(RegisterDTO registerDTO);

    /**
     * 刷新令牌
     *
     * @param refreshToken 刷新令牌
     * @return 新的登录结果
     */
    LoginVO refreshToken(String refreshToken);

    /**
     * 用户登出
     *
     * @param accessToken 访问令牌
     */
    void logout(String accessToken);

    /**
     * 获取验证码
     *
     * @return 验证码图片 Base64
     */
    String getCaptcha();
}
