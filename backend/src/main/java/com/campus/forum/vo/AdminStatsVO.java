package com.campus.forum.vo;

import lombok.Data;

/**
 * 管理后台统计数据 VO
 */
@Data
public class AdminStatsVO {

    /**
     * 总帖子数
     */
    private Long totalPosts;

    /**
     * 学习互助帖子数
     */
    private Long studyHelpPosts;

    /**
     * 表白墙帖子数
     */
    private Long confessionPosts;

    /**
     * 匿名树洞帖子数
     */
    private Long anonymousPosts;

    /**
     * 公告数
     */
    private Long announcements;

    /**
     * 待处理举报数
     */
    private Long pendingReports;

    /**
     * 总评论数
     */
    private Long totalComments;

    /**
     * 总用户数
     */
    private Long totalUsers;
}
