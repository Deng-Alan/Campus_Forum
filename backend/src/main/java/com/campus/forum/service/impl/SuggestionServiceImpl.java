package com.campus.forum.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.campus.forum.dto.CreateSuggestionDTO;
import com.campus.forum.entity.Suggestion;
import com.campus.forum.mapper.SuggestionMapper;
import com.campus.forum.service.SuggestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 建议服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SuggestionServiceImpl extends ServiceImpl<SuggestionMapper, Suggestion> implements SuggestionService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createSuggestion(String userId, CreateSuggestionDTO createSuggestionDTO) {
        // 创建建议
        Suggestion suggestion = new Suggestion();
        suggestion.setId(IdUtil.simpleUUID());
        suggestion.setUserId(userId); // 可能为 null（匿名提交）
        suggestion.setContent(createSuggestionDTO.getContent());
        suggestion.setCategory(createSuggestionDTO.getCategory() != null ? createSuggestionDTO.getCategory() : "general");
        suggestion.setIsAnonymous(createSuggestionDTO.getIsAnonymous() != null && createSuggestionDTO.getIsAnonymous());
        suggestion.setStatus("pending");

        this.save(suggestion);
        log.info("提交建议: {}, 提交人: {}", suggestion.getId(), userId);
    }
}
