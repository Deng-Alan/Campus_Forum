package com.campus.forum.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.campus.forum.dto.CreateAppealDTO;
import com.campus.forum.entity.Appeal;
import com.campus.forum.vo.AppealVO;

/**
 * 申诉服务接口
 */
public interface AppealService extends IService<Appeal> {

    /**
     * 提交申诉
     *
     * @param userId          当前用户ID
     * @param createAppealDTO 申诉DTO
     */
    void createAppeal(String userId, CreateAppealDTO createAppealDTO);

    /**
     * 获取我的申诉列表
     *
     * @param userId 当前用户ID
     * @param page   页码
     * @param size   每页数量
     * @return 分页结果
     */
    Page<AppealVO> getMyAppeals(String userId, Integer page, Integer size);

    /**
     * 将 Appeal 实体转换为 AppealVO
     *
     * @param appeal Appeal实体
     * @return AppealVO
     */
    AppealVO convertToVO(Appeal appeal);
}
