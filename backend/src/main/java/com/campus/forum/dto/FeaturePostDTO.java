package com.campus.forum.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;

/**
 * 设置精选帖子请求 DTO
 */
@Data
public class FeaturePostDTO {

    /**
     * 是否精选
     */
    @NotNull(message = "精选状态不能为空")
    private Boolean isFeatured;
}
