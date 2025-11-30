package com.campus.forum.controller;

import com.campus.forum.common.Result;
import com.campus.forum.dto.CreateSuggestionDTO;
import com.campus.forum.service.SuggestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

/**
 * 建议反馈控制器
 */
@RestController
@RequestMapping("/api/v1/suggestions")
@RequiredArgsConstructor
public class SuggestionController {

    private final SuggestionService suggestionService;

    /**
     * 提交建议
     */
    @PostMapping
    public Result<Void> createSuggestion(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateSuggestionDTO createSuggestionDTO) {

        // 支持匿名提交
        String userId = (userDetails != null && !createSuggestionDTO.getIsAnonymous())
                ? userDetails.getUsername()
                : null;

        suggestionService.createSuggestion(userId, createSuggestionDTO);

        return Result.success();
    }
}
