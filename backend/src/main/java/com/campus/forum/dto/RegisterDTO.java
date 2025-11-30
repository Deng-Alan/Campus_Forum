package com.campus.forum.dto;

import lombok.Data;

import javax.validation.constraints.*;

/**
 * 注册请求 DTO
 */
@Data
public class RegisterDTO {

    /**
     * 用户名
     */
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度为3-20个字符")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "用户名只能包含字母、数字和下划线")
    private String username;

    /**
     * 密码
     */
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 20, message = "密码长度为6-20个字符")
    private String password;

    /**
     * 确认密码
     */
    @NotBlank(message = "确认密码不能为空")
    private String confirmPassword;

    /**
     * 昵称
     */
    @NotBlank(message = "昵称不能为空")
    @Size(min = 2, max = 20, message = "昵称长度为2-20个字符")
    private String nickname;

    /**
     * 邮箱
     */
    @Email(message = "邮箱格式不正确")
    private String email;

    /**
     * 手机号
     */
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "手机号格式不正确")
    private String phone;

    /**
     * 角色: student(学生), teacher(教师)
     */
    @NotBlank(message = "请选择角色")
    @Pattern(regexp = "^(student|teacher)$", message = "角色只能是 student 或 teacher")
    private String role;

    /**
     * 年级 (学生必填)
     */
    private String grade;

    /**
     * 班级 (学生必填)
     */
    private String classNumber;

    /**
     * 验证码
     */
    private String captcha;

    /**
     * 验证码 Key
     */
    private String captchaKey;
}
