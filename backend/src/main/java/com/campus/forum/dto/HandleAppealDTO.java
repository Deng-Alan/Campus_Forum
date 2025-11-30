package com.campus.forum.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

/**
 * 处理申诉请求 DTO
 */
@Data
public class HandleAppealDTO {

    /**
     * 处理状态：approved, rejected
     */
    @NotBlank(message = "处理状态不能为空")
    @Pattern(regexp = "^(approved|rejected)$", message = "处理状态只能是 approved 或 rejected")
    private String status;

    /**
     * 管理员回复
     */
    private String adminResponse;
}
