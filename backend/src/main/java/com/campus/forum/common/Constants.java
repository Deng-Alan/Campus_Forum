package com.campus.forum.common;

/**
 * 系统常量定义
 */
public final class Constants {

    private Constants() {
        throw new IllegalStateException("Constants class");
    }

    // ========================== 用户相关 ==========================
    
    /**
     * 用户角色
     */
    public static final String ROLE_STUDENT = "student";
    public static final String ROLE_TEACHER = "teacher";
    public static final String ROLE_ADMIN = "admin";

    /**
     * 用户状态
     */
    public static final int USER_STATUS_DISABLED = 0;
    public static final int USER_STATUS_NORMAL = 1;
    public static final int USER_STATUS_PENDING = 2;

    // ========================== 帖子相关 ==========================
    
    /**
     * 帖子状态
     */
    public static final int POST_STATUS_DRAFT = 0;
    public static final int POST_STATUS_PUBLISHED = 1;
    public static final int POST_STATUS_HIDDEN = 2;
    public static final int POST_STATUS_DELETED = 3;

    /**
     * 帖子类型
     */
    public static final String POST_TYPE_NORMAL = "normal";
    public static final String POST_TYPE_QUESTION = "question";
    public static final String POST_TYPE_ANNOUNCEMENT = "announcement";

    // ========================== Redis Key 前缀 ==========================
    
    public static final String REDIS_KEY_PREFIX = "campus:";
    public static final String REDIS_KEY_USER = REDIS_KEY_PREFIX + "user:";
    public static final String REDIS_KEY_TOKEN = REDIS_KEY_PREFIX + "token:";
    public static final String REDIS_KEY_CAPTCHA = REDIS_KEY_PREFIX + "captcha:";
    public static final String REDIS_KEY_POST = REDIS_KEY_PREFIX + "post:";
    public static final String REDIS_KEY_HOT_POSTS = REDIS_KEY_PREFIX + "hot:posts";
    public static final String REDIS_KEY_LIKE = REDIS_KEY_PREFIX + "like:";
    public static final String REDIS_KEY_VIEW = REDIS_KEY_PREFIX + "view:";

    // ========================== 分页默认值 ==========================
    
    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE = 100;
}
