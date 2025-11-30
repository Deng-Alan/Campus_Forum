package com.campus.forum.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.forum.common.Result;
import com.campus.forum.dto.CreateAppealDTO;
import com.campus.forum.service.AppealService;
import com.campus.forum.vo.AppealVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

/**
 * 申诉控制器
 */
@RestController
@RequestMapping("/api/v1/appeals")
@RequiredArgsConstructor
public class AppealController {

    private final AppealService appealService;

    /**
     * 提交申诉
     */
    @PostMapping
    public Result<Void> createAppeal(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateAppealDTO createAppealDTO) {

        String userId = userDetails.getUsername();
        appealService.createAppeal(userId, createAppealDTO);

        return Result.success();
    }

    /**
     * 获取我的申诉列表
     */
    @GetMapping("/my")
    public Result<Map<String, Object>> getMyAppeals(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {

        String userId = userDetails.getUsername();
        Page<AppealVO> result = appealService.getMyAppeals(userId, page, size);

        Map<String, Object> data = Map.of(
                "list", result.getRecords(),
                "total", result.getTotal(),
                "page", result.getCurrent(),
                "size", result.getSize()
        );

        return Result.success(data);
    }
}
