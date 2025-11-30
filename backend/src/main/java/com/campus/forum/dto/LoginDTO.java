package com.campus.forum.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 登录请求 DTO
 */
@Data
public class LoginDTO {

    /**
     * 用户名或邮箱
     */
    @NotBlank(message = "用户名或邮箱不能为空")
    private String usernameOrEmail;

    /**
     * 密码
     */
    @NotBlank(message = "密码不能为空")
    private String password;

    /**
     * 验证码
     */
    private String captcha;

    /**
     * 验证码 Key
     */
    private String captchaKey;

    /**
     * 记住我
     */
    private Boolean rememberMe = false;
}
