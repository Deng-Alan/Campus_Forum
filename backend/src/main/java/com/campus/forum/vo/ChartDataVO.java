package com.campus.forum.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 图表数据 VO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChartDataVO {

    /**
     * 日期
     */
    private String date;

    /**
     * 帖子数
     */
    private Long posts;

    /**
     * 评论数
     */
    private Long comments;
}
