package com.campus.forum.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.campus.forum.entity.Announcement;
import com.campus.forum.mapper.AnnouncementMapper;
import com.campus.forum.service.AnnouncementService;
import com.campus.forum.vo.AnnouncementVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 公告服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl extends ServiceImpl<AnnouncementMapper, Announcement> implements AnnouncementService {

    @Override
    public List<AnnouncementVO> getAnnouncementList(Integer limit) {
        if (limit == null || limit <= 0) {
            limit = 5;
        }

        LambdaQueryWrapper<Announcement> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(Announcement::getIsTop, Announcement::getCreatedAt)
                .last("LIMIT " + limit);

        List<Announcement> announcements = this.list(wrapper);

        return announcements.stream().map(this::convertToVO).toList();
    }

    @Override
    public AnnouncementVO convertToVO(Announcement announcement) {
        AnnouncementVO vo = new AnnouncementVO();
        BeanUtils.copyProperties(announcement, vo);
        return vo;
    }
}
