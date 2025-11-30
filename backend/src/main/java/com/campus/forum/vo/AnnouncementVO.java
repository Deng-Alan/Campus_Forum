package com.campus.forum.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 公告响应 VO
 */
@Data
public class AnnouncementVO {

    /**
     * 公告ID
     */
    private String id;

    /**
     * 公告标题
     */
    private String title;

    /**
     * 公告内容
     */
    private String content;

    /**
     * 公告类型
     */
    private String type;

    /**
     * 是否置顶
     */
    private Boolean isTop;

    /**
     * 创建时间
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss'Z'", timezone = "UTC")
    private LocalDateTime createdAt;
}
