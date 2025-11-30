package com.campus.forum.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

/**
 * 处理举报请求 DTO
 */
@Data
public class HandleReportDTO {

    /**
     * 处理状态：resolved, ignored
     */
    @NotBlank(message = "处理状态不能为空")
    @Pattern(regexp = "^(resolved|ignored)$", message = "处理状态只能是 resolved 或 ignored")
    private String status;

    /**
     * 是否删除帖子
     */
    private Boolean deletePost;
}
