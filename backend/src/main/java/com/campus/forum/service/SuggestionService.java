package com.campus.forum.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.campus.forum.dto.CreateSuggestionDTO;
import com.campus.forum.entity.Suggestion;

/**
 * 建议服务接口
 */
public interface SuggestionService extends IService<Suggestion> {

    /**
     * 提交建议
     *
     * @param userId               当前用户ID（可为null，支持匿名）
     * @param createSuggestionDTO 建议DTO
     */
    void createSuggestion(String userId, CreateSuggestionDTO createSuggestionDTO);
}
