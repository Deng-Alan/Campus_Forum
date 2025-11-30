package com.campus.forum.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

/**
 * 创建申诉请求 DTO
 */
@Data
public class CreateAppealDTO {

    /**
     * 申诉的帖子ID
     */
    @NotBlank(message = "帖子ID不能为空")
    private String postId;

    /**
     * 申诉理由
     */
    @NotBlank(message = "申诉理由不能为空")
    private String reason;
}
