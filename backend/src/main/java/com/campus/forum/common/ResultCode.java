package com.campus.forum.common;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 响应状态码枚举
 */
@Getter
@AllArgsConstructor
public enum ResultCode {

    // 成功
    SUCCESS(200, "操作成功"),

    // 客户端错误 4xx
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未授权，请登录"),
    FORBIDDEN(403, "拒绝访问"),
    NOT_FOUND(404, "资源不存在"),
    METHOD_NOT_ALLOWED(405, "请求方法不允许"),
    CONFLICT(409, "数据冲突"),
    VALIDATION_ERROR(422, "参数验证失败"),
    TOO_MANY_REQUESTS(429, "请求过于频繁"),

    // 服务端错误 5xx
    ERROR(500, "服务器内部错误"),
    SERVICE_UNAVAILABLE(503, "服务暂不可用"),

    // 业务错误 1xxx
    USER_NOT_FOUND(1001, "用户不存在"),
    USER_ALREADY_EXISTS(1002, "用户已存在"),
    PASSWORD_ERROR(1003, "密码错误"),
    ACCOUNT_DISABLED(1004, "账号已禁用"),
    TOKEN_EXPIRED(1005, "登录已过期，请重新登录"),
    TOKEN_INVALID(1006, "无效的Token"),
    CAPTCHA_ERROR(1007, "验证码错误"),
    CAPTCHA_EXPIRED(1008, "验证码已过期"),

    // 帖子相关 2xxx
    POST_NOT_FOUND(2001, "帖子不存在"),
    POST_DELETED(2002, "帖子已删除"),
    POST_FORBIDDEN(2003, "没有权限操作此帖子"),
    COMMENT_NOT_FOUND(2004, "评论不存在"),
    CONTENT_VIOLATION(2005, "内容违规"),

    // 文件相关 3xxx
    FILE_UPLOAD_ERROR(3001, "文件上传失败"),
    FILE_TYPE_NOT_ALLOWED(3002, "不支持的文件类型"),
    FILE_SIZE_EXCEEDED(3003, "文件大小超出限制"),
    FILE_NOT_FOUND(3004, "文件不存在"),

    // 权限相关 4xxx
    PERMISSION_DENIED(4001, "没有操作权限"),
    ROLE_NOT_FOUND(4002, "角色不存在");

    /**
     * 状态码
     */
    private final Integer code;

    /**
     * 消息
     */
    private final String message;
}
