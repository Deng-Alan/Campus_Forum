package com.campus.forum.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.campus.forum.entity.Announcement;
import com.campus.forum.vo.AnnouncementVO;

import java.util.List;

/**
 * 公告服务接口
 */
public interface AnnouncementService extends IService<Announcement> {

    /**
     * 获取公告列表（置顶优先）
     *
     * @param limit 获取数量
     * @return 公告列表
     */
    List<AnnouncementVO> getAnnouncementList(Integer limit);

    /**
     * 将 Announcement 实体转换为 AnnouncementVO
     *
     * @param announcement Announcement实体
     * @return AnnouncementVO
     */
    AnnouncementVO convertToVO(Announcement announcement);
}
