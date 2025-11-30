package com.campus.forum.controller;

import com.campus.forum.common.Result;
import com.campus.forum.service.AnnouncementService;
import com.campus.forum.vo.AnnouncementVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 公告控制器
 */
@RestController
@RequestMapping("/api/v1/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    /**
     * 获取公告列表
     */
    @GetMapping
    public Result<List<AnnouncementVO>> getAnnouncements(
            @RequestParam(defaultValue = "5") Integer limit) {

        List<AnnouncementVO> announcements = announcementService.getAnnouncementList(limit);
        return Result.success(announcements);
    }
}
