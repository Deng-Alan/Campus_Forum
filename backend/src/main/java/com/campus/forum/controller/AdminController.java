package com.campus.forum.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.forum.common.Result;
import com.campus.forum.dto.*;
import com.campus.forum.entity.*;
import com.campus.forum.service.*;
import com.campus.forum.vo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

/**
 * 管理后台控制器
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final PostService postService;
    private final AnnouncementService announcementService;
    private final ReportService reportService;
    private final AppealService appealService;
    private final SuggestionService suggestionService;
    private final CommentService commentService;
    private final UserService userService;

    /**
     * 获取统计数据
     */
    @GetMapping("/stats")
    public Result<AdminStatsVO> getStats() {
        AdminStatsVO stats = adminService.getStats();
        return Result.success(stats);
    }

    /**
     * 获取图表数据
     */
    @GetMapping("/stats/chart")
    public Result<List<ChartDataVO>> getChartData(
            @RequestParam(defaultValue = "7") Integer days) {

        List<ChartDataVO> chartData = adminService.getChartData(days);
        return Result.success(chartData);
    }

    /**
     * 获取帖子列表（管理员）
     */
    @GetMapping("/posts")
    public Result<Map<String, Object>> getAdminPosts(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String reviewStatus,
            @RequestParam(required = false) String keyword) {

        Page<PostVO> result = postService.getPostList(page, size, type, null, reviewStatus);

        Map<String, Object> data = Map.of(
                "list", result.getRecords(),
                "total", result.getTotal(),
                "page", result.getCurrent(),
                "size", result.getSize()
        );

        return Result.success(data);
    }

    /**
     * 审核帖子
     */
    @PutMapping("/posts/{postId}/review")
    public Result<Void> reviewPost(
            @PathVariable String postId,
            @Valid @RequestBody ReviewPostDTO reviewPostDTO) {

        adminService.reviewPost(postId, reviewPostDTO);
        return Result.success();
    }

    /**
     * 删除帖子（管理员）
     */
    @DeleteMapping("/posts/{postId}")
    public Result<Void> deletePost(@PathVariable String postId) {
        adminService.deletePostByAdmin(postId);
        return Result.success();
    }

    /**
     * 设置/取消精选
     */
    @PutMapping("/posts/{postId}/feature")
    public Result<Void> featurePost(
            @PathVariable String postId,
            @Valid @RequestBody FeaturePostDTO featurePostDTO) {

        adminService.featurePost(postId, featurePostDTO);
        return Result.success();
    }

    /**
     * 获取公告列表（管理员）
     */
    @GetMapping("/announcements")
    public Result<List<AnnouncementVO>> getAdminAnnouncements() {
        LambdaQueryWrapper<Announcement> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(Announcement::getIsTop, Announcement::getCreatedAt);

        List<Announcement> announcements = announcementService.list(wrapper);
        List<AnnouncementVO> result = announcements.stream()
                .map(announcementService::convertToVO)
                .toList();

        return Result.success(result);
    }

    /**
     * 创建公告
     */
    @PostMapping("/announcements")
    public Result<Void> createAnnouncement(
            @Valid @RequestBody CreateAnnouncementDTO createAnnouncementDTO) {

        adminService.createAnnouncement(createAnnouncementDTO);
        return Result.success();
    }

    /**
     * 更新公告
     */
    @PutMapping("/announcements/{announcementId}")
    public Result<Void> updateAnnouncement(
            @PathVariable String announcementId,
            @Valid @RequestBody CreateAnnouncementDTO createAnnouncementDTO) {

        adminService.updateAnnouncement(announcementId, createAnnouncementDTO);
        return Result.success();
    }

    /**
     * 删除公告
     */
    @DeleteMapping("/announcements/{announcementId}")
    public Result<Void> deleteAnnouncement(@PathVariable String announcementId) {
        adminService.deleteAnnouncement(announcementId);
        return Result.success();
    }

    /**
     * 置顶/取消置顶公告
     */
    @PutMapping("/announcements/{announcementId}/top")
    public Result<Void> topAnnouncement(
            @PathVariable String announcementId,
            @RequestBody Map<String, Boolean> request) {

        Announcement announcement = announcementService.getById(announcementId);
        if (announcement == null) {
            return Result.error("公告不存在");
        }

        announcement.setIsTop(request.get("isTop"));
        announcementService.updateById(announcement);

        return Result.success();
    }

    /**
     * 获取举报列表
     */
    @GetMapping("/reports")
    public Result<List<Report>> getReports(
            @RequestParam(required = false) String status) {

        LambdaQueryWrapper<Report> wrapper = new LambdaQueryWrapper<>();
        if (status != null && !status.isEmpty()) {
            wrapper.eq(Report::getStatus, status);
        }
        wrapper.orderByDesc(Report::getCreatedAt);

        List<Report> reports = reportService.list(wrapper);
        return Result.success(reports);
    }

    /**
     * 处理举报
     */
    @PutMapping("/reports/{reportId}")
    public Result<Void> handleReport(
            @PathVariable String reportId,
            @Valid @RequestBody HandleReportDTO handleReportDTO) {

        adminService.handleReport(reportId, handleReportDTO);
        return Result.success();
    }

    /**
     * 获取申诉列表
     */
    @GetMapping("/appeals")
    public Result<List<Appeal>> getAppeals(
            @RequestParam(required = false) String status) {

        LambdaQueryWrapper<Appeal> wrapper = new LambdaQueryWrapper<>();
        if (status != null && !status.isEmpty()) {
            wrapper.eq(Appeal::getStatus, status);
        }
        wrapper.orderByDesc(Appeal::getCreatedAt);

        List<Appeal> appeals = appealService.list(wrapper);
        return Result.success(appeals);
    }

    /**
     * 处理申诉
     */
    @PutMapping("/appeals/{appealId}")
    public Result<Void> handleAppeal(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String appealId,
            @Valid @RequestBody HandleAppealDTO handleAppealDTO) {

        var admin = userService.getByUsername(userDetails.getUsername());
        String adminId = admin.getId();
        adminService.handleAppeal(adminId, appealId, handleAppealDTO);

        return Result.success();
    }

    /**
     * 获取建议列表
     */
    @GetMapping("/suggestions")
    public Result<List<Suggestion>> getSuggestions(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status) {

        LambdaQueryWrapper<Suggestion> wrapper = new LambdaQueryWrapper<>();
        if (category != null && !category.isEmpty()) {
            wrapper.eq(Suggestion::getCategory, category);
        }
        if (status != null && !status.isEmpty()) {
            wrapper.eq(Suggestion::getStatus, status);
        }
        wrapper.orderByDesc(Suggestion::getCreatedAt);

        List<Suggestion> suggestions = suggestionService.list(wrapper);
        return Result.success(suggestions);
    }

    /**
     * 处理建议
     */
    @PutMapping("/suggestions/{suggestionId}")
    public Result<Void> handleSuggestion(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String suggestionId,
            @Valid @RequestBody HandleSuggestionDTO handleSuggestionDTO) {

        var admin = userService.getByUsername(userDetails.getUsername());
        String adminId = admin.getId();
        adminService.handleSuggestion(adminId, suggestionId, handleSuggestionDTO);

        return Result.success();
    }

    /**
     * 获取评论列表（管理员）
     */
    @GetMapping("/comments")
    public Result<Map<String, Object>> getAdminComments(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {

        Page<Comment> commentPage = new Page<>(page, size);
        LambdaQueryWrapper<Comment> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(Comment::getCreatedAt);

        Page<Comment> result = commentService.page(commentPage, wrapper);

        Map<String, Object> data = Map.of(
                "list", result.getRecords(),
                "total", result.getTotal(),
                "page", result.getCurrent(),
                "size", result.getSize()
        );

        return Result.success(data);
    }

    /**
     * 删除评论（管理员）
     */
    @DeleteMapping("/comments/{commentId}")
    public Result<Void> deleteComment(@PathVariable String commentId) {
        commentService.removeById(commentId);
        return Result.success();
    }

    /**
     * 获取系统设置
     */
    @GetMapping("/settings")
    public Result<Map<String, String>> getSettings() {
        Map<String, String> settings = adminService.getSettings();
        return Result.success(settings);
    }

    /**
     * 更新系统设置
     */
    @PutMapping("/settings")
    public Result<Void> updateSettings(@RequestBody Map<String, String> settings) {
        adminService.updateSettings(settings);
        return Result.success();
    }
}
