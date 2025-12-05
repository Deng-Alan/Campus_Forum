package com.campus.forum.controller;

import com.campus.forum.common.Result;
import com.campus.forum.dto.CreateSuggestionDTO;
import com.campus.forum.service.SuggestionService;
import com.campus.forum.service.UserService;
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
    private final UserService userService;

    /**
     * 提交建议
     */
    @PostMapping
    public Result<Void> createSuggestion(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateSuggestionDTO createSuggestionDTO) {

        // 支持匿名提交
        String userId = null;
        if (userDetails != null && !createSuggestionDTO.getIsAnonymous()) {
            var user = userService.getByUsername(userDetails.getUsername());
            userId = user.getId();
        }

        suggestionService.createSuggestion(userId, createSuggestionDTO);

        return Result.success();
    }
}
