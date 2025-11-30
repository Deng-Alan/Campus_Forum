package com.campus.forum.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 创建举报请求 DTO
 */
@Data
public class CreateReportDTO {

    /**
     * 被举报的帖子ID
     */
    @NotBlank(message = "帖子ID不能为空")
    private String postId;

    /**
     * 举报理由
     */
    @NotBlank(message = "举报理由不能为空")
    private String reason;
}
