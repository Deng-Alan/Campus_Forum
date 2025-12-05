package com.campus.forum.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * announcements 表实体
 */
@Data
@TableName("announcements")
public class Announcement {

    /**
     * 公告唯一标识（UUID 字符串）
     */
    @TableId(type = IdType.INPUT)
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
     * 公告类型：notice, activity, urgent
     */
    private String type;

    /**
     * 是否置顶
     */
    private Boolean isTop;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
