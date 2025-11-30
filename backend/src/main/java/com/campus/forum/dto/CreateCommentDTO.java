package com.campus.forum.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

/**
 * 创建评论请求 DTO
 */
@Data
public class CreateCommentDTO {

    /**
     * 评论内容
     */
    @NotBlank(message = "评论内容不能为空")
    @Size(min = 1, max = 500, message = "评论内容长度为1-500个字符")
    private String content;
}
