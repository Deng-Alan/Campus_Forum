package com.campus.forum.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.campus.forum.common.ResultCode;
import com.campus.forum.dto.*;
import com.campus.forum.entity.*;
import com.campus.forum.exception.BusinessException;
import com.campus.forum.mapper.*;
import com.campus.forum.service.AdminService;
import com.campus.forum.vo.AdminStatsVO;
import com.campus.forum.vo.ChartDataVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 管理后台服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final PostMapper postMapper;
    private final CommentMapper commentMapper;
    private final UserProfileMapper userProfileMapper;
    private final AnnouncementMapper announcementMapper;
    private final ReportMapper reportMapper;
    private final AppealMapper appealMapper;
    private final SuggestionMapper suggestionMapper;
    private final SystemSettingMapper systemSettingMapper;

    @Override
    public AdminStatsVO getStats() {
        AdminStatsVO stats = new AdminStatsVO();

        // 总帖子数
        stats.setTotalPosts(postMapper.selectCount(null));

        // 各类型帖子数
        stats.setStudyHelpPosts(postMapper.selectCount(
                new LambdaQueryWrapper<Post>().eq(Post::getType, "study_help")));
        stats.setConfessionPosts(postMapper.selectCount(
                new LambdaQueryWrapper<Post>().eq(Post::getType, "confession")));
        stats.setAnonymousPosts(postMapper.selectCount(
                new LambdaQueryWrapper<Post>().eq(Post::getType, "anonymous")));

        // 公告数
        stats.setAnnouncements(announcementMapper.selectCount(null));

        // 待处理举报数
        stats.setPendingReports(reportMapper.selectCount(
                new LambdaQueryWrapper<Report>().eq(Report::getStatus, "pending")));

        // 总评论数
        stats.setTotalComments(commentMapper.selectCount(null));

        // 总用户数
        stats.setTotalUsers(userProfileMapper.selectCount(null));

        return stats;
    }

    @Override
    public List<ChartDataVO> getChartData(Integer days) {
        if (days == null || days <= 0) {
            days = 7;
        }

        List<ChartDataVO> result = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

            // 统计当天帖子数
            QueryWrapper<Post> postWrapper = new QueryWrapper<>();
            postWrapper.ge("created_at", startOfDay)
                    .lt("created_at", endOfDay);
            Long postCount = postMapper.selectCount(postWrapper);

            // 统计当天评论数
            QueryWrapper<Comment> commentWrapper = new QueryWrapper<>();
            commentWrapper.ge("created_at", startOfDay)
                    .lt("created_at", endOfDay);
            Long commentCount = commentMapper.selectCount(commentWrapper);

            String dateStr = date.getMonthValue() + "/" + date.getDayOfMonth();
            result.add(new ChartDataVO(dateStr, postCount, commentCount));
        }

        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void reviewPost(String postId, ReviewPostDTO reviewPostDTO) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "帖子不存在");
        }

        post.setReviewStatus(reviewPostDTO.getStatus());
        post.setStatus(reviewPostDTO.getStatus());
        postMapper.updateById(post);

        log.info("审核帖子: {}, 状态: {}", postId, reviewPostDTO.getStatus());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void featurePost(String postId, FeaturePostDTO featurePostDTO) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "帖子不存在");
        }

        post.setIsFeatured(featurePostDTO.getIsFeatured());
        postMapper.updateById(post);

        log.info("设置帖子精选状态: {}, 精选: {}", postId, featurePostDTO.getIsFeatured());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePostByAdmin(String postId) {
        Post post = postMapper.selectById(postId);
        if (post == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "帖子不存在");
        }

        postMapper.deleteById(postId);
        log.info("管理员删除帖子: {}", postId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createAnnouncement(CreateAnnouncementDTO createAnnouncementDTO) {
        Announcement announcement = new Announcement();
        announcement.setTitle(createAnnouncementDTO.getTitle());
        announcement.setContent(createAnnouncementDTO.getContent());
        announcement.setType(createAnnouncementDTO.getType() != null ? createAnnouncementDTO.getType() : "notice");
        announcement.setIsTop(createAnnouncementDTO.getIsTop() != null && createAnnouncementDTO.getIsTop());

        announcementMapper.insert(announcement);
        log.info("创建公告: {}", announcement.getId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateAnnouncement(String announcementId, CreateAnnouncementDTO createAnnouncementDTO) {
        Announcement announcement = announcementMapper.selectById(announcementId);
        if (announcement == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "公告不存在");
        }

        announcement.setTitle(createAnnouncementDTO.getTitle());
        announcement.setContent(createAnnouncementDTO.getContent());
        announcement.setType(createAnnouncementDTO.getType() != null ? createAnnouncementDTO.getType() : "notice");
        announcement.setIsTop(createAnnouncementDTO.getIsTop() != null && createAnnouncementDTO.getIsTop());

        announcementMapper.updateById(announcement);
        log.info("更新公告: {}", announcementId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteAnnouncement(String announcementId) {
        Announcement announcement = announcementMapper.selectById(announcementId);
        if (announcement == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "公告不存在");
        }

        announcementMapper.deleteById(announcementId);
        log.info("删除公告: {}", announcementId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void handleReport(String reportId, HandleReportDTO handleReportDTO) {
        Report report = reportMapper.selectById(reportId);
        if (report == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "举报不存在");
        }

        report.setStatus(handleReportDTO.getStatus());
        reportMapper.updateById(report);

        // 如果选择删除帖子
        if (Boolean.TRUE.equals(handleReportDTO.getDeletePost())) {
            postMapper.deleteById(report.getPostId());
            log.info("处理举报时删除帖子: {}", report.getPostId());
        }

        log.info("处理举报: {}, 状态: {}", reportId, handleReportDTO.getStatus());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void handleAppeal(String adminId, String appealId, HandleAppealDTO handleAppealDTO) {
        Appeal appeal = appealMapper.selectById(appealId);
        if (appeal == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "申诉不存在");
        }

        appeal.setStatus(handleAppealDTO.getStatus());
        appeal.setAdminResponse(handleAppealDTO.getAdminResponse());
        appeal.setAdminId(adminId);
        appealMapper.updateById(appeal);

        // 如果申诉通过，恢复帖子状态
        if ("approved".equals(handleAppealDTO.getStatus())) {
            Post post = postMapper.selectById(appeal.getPostId());
            if (post != null) {
                post.setReviewStatus("approved");
                post.setStatus("approved");
                postMapper.updateById(post);
            }
        }

        log.info("处理申诉: {}, 状态: {}", appealId, handleAppealDTO.getStatus());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void handleSuggestion(String adminId, String suggestionId, HandleSuggestionDTO handleSuggestionDTO) {
        Suggestion suggestion = suggestionMapper.selectById(suggestionId);
        if (suggestion == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "建议不存在");
        }

        suggestion.setStatus(handleSuggestionDTO.getStatus());
        suggestion.setAdminResponse(handleSuggestionDTO.getAdminResponse());
        suggestion.setAdminId(adminId);
        suggestionMapper.updateById(suggestion);

        log.info("处理建议: {}, 状态: {}", suggestionId, handleSuggestionDTO.getStatus());
    }

    @Override
    public Map<String, String> getSettings() {
        List<SystemSetting> settings = systemSettingMapper.selectList(null);
        Map<String, String> result = new HashMap<>();
        for (SystemSetting setting : settings) {
            result.put(setting.getKey(), setting.getValue());
        }
        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateSettings(Map<String, String> settings) {
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            SystemSetting setting = systemSettingMapper.selectById(entry.getKey());
            if (setting != null) {
                setting.setValue(entry.getValue());
                systemSettingMapper.updateById(setting);
            }
        }
        log.info("更新系统设置");
    }
}
