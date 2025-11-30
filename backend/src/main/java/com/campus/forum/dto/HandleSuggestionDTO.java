package com.campus.forum.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

/**
 * 处理建议请求 DTO
 */
@Data
public class HandleSuggestionDTO {

    /**
     * 处理状态：pending, reviewing, accepted, rejected, implemented
     */
    @NotBlank(message = "处理状态不能为空")
    @Pattern(regexp = "^(pending|reviewing|accepted|rejected|implemented)$",
            message = "处理状态只能是 pending、reviewing、accepted、rejected 或 implemented")
    private String status;

    /**
     * 管理员回复
     */
    private String adminResponse;
}
