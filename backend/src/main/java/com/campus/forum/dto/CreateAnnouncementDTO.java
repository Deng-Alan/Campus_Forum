package com.campus.forum.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

/**
 * 创建/更新公告请求 DTO
 */
@Data
public class CreateAnnouncementDTO {

    /**
     * 公告标题
     */
    @NotBlank(message = "公告标题不能为空")
    private String title;

    /**
     * 公告内容
     */
    private String content;

    /**
     * 公告类型：notice, activity, urgent
     */
    @Pattern(regexp = "^(notice|activity|urgent)$", message = "公告类型只能是 notice、activity 或 urgent")
    private String type;

    /**
     * 是否置顶
     */
    private Boolean isTop;
}
