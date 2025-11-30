package com.campus.forum.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;

/**
 * 创建建议请求 DTO
 */
@Data
public class CreateSuggestionDTO {

    /**
     * 建议内容
     */
    @NotBlank(message = "建议内容不能为空")
    private String content;

    /**
     * 建议类别：general, feature, bug, improvement
     */
    @Pattern(regexp = "^(general|feature|bug|improvement)$",
            message = "类别只能是 general、feature、bug 或 improvement")
    private String category;

    /**
     * 是否匿名提交
     */
    private Boolean isAnonymous;
}
