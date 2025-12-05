package com.campus.forum.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.campus.forum.common.ResultCode;
import com.campus.forum.dto.CreateReportDTO;
import com.campus.forum.entity.Post;
import com.campus.forum.entity.Report;
import com.campus.forum.exception.BusinessException;
import com.campus.forum.mapper.PostMapper;
import com.campus.forum.mapper.ReportMapper;
import com.campus.forum.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 举报服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl extends ServiceImpl<ReportMapper, Report> implements ReportService {

    private final PostMapper postMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createReport(String userId, CreateReportDTO createReportDTO) {
        // 检查帖子是否存在
        Post post = postMapper.selectById(createReportDTO.getPostId());
        if (post == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "帖子不存在");
        }

        // 创建举报
        Report report = new Report();
        report.setId(IdUtil.simpleUUID());
        report.setPostId(createReportDTO.getPostId());
        report.setUserId(userId); // 可能为 null（匿名举报）
        report.setReason(createReportDTO.getReason());
        report.setStatus("pending");

        this.save(report);
        log.info("举报帖子: {}, 举报人: {}", createReportDTO.getPostId(), userId);
    }
}
