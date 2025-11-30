package com.campus.forum.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

/**
 * 审核帖子请求 DTO
 */
@Data
public class ReviewPostDTO {

    /**
     * 审核状态：approved, rejected
     */
    @NotBlank(message = "审核状态不能为空")
    @Pattern(regexp = "^(approved|rejected)$", message = "审核状态只能是 approved 或 rejected")
    private String status;
}
