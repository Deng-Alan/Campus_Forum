package com.campus.forum.vo;

import lombok.Data;

/**
 * 排行榜响应 VO
 */
@Data
public class LeaderboardVO {

    /**
     * 排名
     */
    private Integer rank;

    /**
     * 作者名称
     */
    private String authorName;

    /**
     * 发帖数
     */
    private Integer postCount;

    /**
     * 评论数
     */
    private Integer commentCount;

    /**
     * 总点赞数
     */
    private Integer totalLikes;

    /**
     * 积分
     */
    private Double score;
}
