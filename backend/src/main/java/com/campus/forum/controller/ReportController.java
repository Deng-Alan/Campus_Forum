package com.campus.forum.controller;

import com.campus.forum.common.Result;
import com.campus.forum.dto.CreateReportDTO;
import com.campus.forum.service.ReportService;
import com.campus.forum.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

/**
 * 举报控制器
 */
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final UserService userService;

    /**
     * 提交举报
     */
    @PostMapping
    public Result<Void> createReport(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateReportDTO createReportDTO) {

        // 支持匿名举报，所以 userId 可能为 null
        String userId = null;
        if (userDetails != null) {
            var user = userService.getByUsername(userDetails.getUsername());
            userId = user.getId();
        }
        reportService.createReport(userId, createReportDTO);

        return Result.success();
    }
}
