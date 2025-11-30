package com.campus.forum.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.campus.forum.dto.CreateReportDTO;
import com.campus.forum.entity.Report;

/**
 * 举报服务接口
 */
public interface ReportService extends IService<Report> {

    /**
     * 提交举报
     *
     * @param userId          当前用户ID（可为null，支持匿名）
     * @param createReportDTO 举报DTO
     */
    void createReport(String userId, CreateReportDTO createReportDTO);
}
