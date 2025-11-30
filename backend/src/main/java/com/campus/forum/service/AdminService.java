package com.campus.forum.service;

import com.campus.forum.dto.*;
import com.campus.forum.vo.AdminStatsVO;
import com.campus.forum.vo.ChartDataVO;

import java.util.List;
import java.util.Map;

/**
 * 管理后台服务接口
 */
public interface AdminService {

    /**
     * 获取统计数据
     */
    AdminStatsVO getStats();

    /**
     * 获取图表数据
     */
    List<ChartDataVO> getChartData(Integer days);

    /**
     * 审核帖子
     */
    void reviewPost(String postId, ReviewPostDTO reviewPostDTO);

    /**
     * 设置/取消精选帖子
     */
    void featurePost(String postId, FeaturePostDTO featurePostDTO);

    /**
     * 删除帖子（管理员）
     */
    void deletePostByAdmin(String postId);

    /**
     * 创建公告
     */
    void createAnnouncement(CreateAnnouncementDTO createAnnouncementDTO);

    /**
     * 更新公告
     */
    void updateAnnouncement(String announcementId, CreateAnnouncementDTO createAnnouncementDTO);

    /**
     * 删除公告
     */
    void deleteAnnouncement(String announcementId);

    /**
     * 处理举报
     */
    void handleReport(String reportId, HandleReportDTO handleReportDTO);

    /**
     * 处理申诉
     */
    void handleAppeal(String adminId, String appealId, HandleAppealDTO handleAppealDTO);

    /**
     * 处理建议
     */
    void handleSuggestion(String adminId, String suggestionId, HandleSuggestionDTO handleSuggestionDTO);

    /**
     * 获取系统设置
     */
    Map<String, String> getSettings();

    /**
     * 更新系统设置
     */
    void updateSettings(Map<String, String> settings);
}
