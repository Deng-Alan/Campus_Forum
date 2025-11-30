package com.campus.forum.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;

/**
 * 创建帖子请求 DTO
 */
@Data
public class CreatePostDTO {

    /**
     * 帖子内容
     */
    @NotBlank(message = "帖子内容不能为空")
    @Size(min = 5, max = 2000, message = "帖子内容长度为5-2000个字符")
    private String content;

    /**
     * 帖子类型：campus_fun, study_help, confession, anonymous
     */
    @NotBlank(message = "帖子类型不能为空")
    @Pattern(regexp = "^(campus_fun|study_help|confession|anonymous)$",
            message = "帖子类型只能是 campus_fun、study_help、confession 或 anonymous")
    private String type;

    /**
     * 学科（仅 study_help 类型需要）
     */
    private String subject;

    /**
     * 图片 URL
     */
    private String imageUrl;

    /**
     * 引用的帖子 ID
     */
    private String quotedPostId;
}
