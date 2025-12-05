package com.campus.forum.service.impl;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.campus.forum.common.ResultCode;
import com.campus.forum.dto.CreateAppealDTO;
import com.campus.forum.entity.Appeal;
import com.campus.forum.entity.Post;
import com.campus.forum.exception.BusinessException;
import com.campus.forum.mapper.AppealMapper;
import com.campus.forum.mapper.PostMapper;
import com.campus.forum.service.AppealService;
import com.campus.forum.vo.AppealVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 申诉服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AppealServiceImpl extends ServiceImpl<AppealMapper, Appeal> implements AppealService {

    private final PostMapper postMapper;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void createAppeal(String userId, CreateAppealDTO createAppealDTO) {
        // 检查帖子是否存在
        Post post = postMapper.selectById(createAppealDTO.getPostId());
        if (post == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "帖子不存在");
        }

        // 只能对自己的帖子申诉
        if (!post.getUserId().equals(userId)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只能对自己的帖子申诉");
        }

        // 只能对被拒绝的帖子申诉
        if (!"rejected".equals(post.getReviewStatus())) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "只能对被拒绝的帖子申诉");
        }

        // 检查是否已有待处理的申诉
        LambdaQueryWrapper<Appeal> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Appeal::getPostId, createAppealDTO.getPostId())
                .eq(Appeal::getStatus, "pending");
        long count = this.count(wrapper);
        if (count > 0) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "该帖子已有待处理的申诉");
        }

        // 创建申诉
        Appeal appeal = new Appeal();
        appeal.setId(IdUtil.simpleUUID());
        appeal.setPostId(createAppealDTO.getPostId());
        appeal.setUserId(userId);
        appeal.setReason(createAppealDTO.getReason());
        appeal.setStatus("pending");

        this.save(appeal);
        log.info("用户 {} 申诉帖子: {}", userId, createAppealDTO.getPostId());
    }

    @Override
    public Page<AppealVO> getMyAppeals(String userId, Integer page, Integer size) {
        Page<Appeal> appealPage = new Page<>(page, size);
        LambdaQueryWrapper<Appeal> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Appeal::getUserId, userId)
                .orderByDesc(Appeal::getCreatedAt);

        Page<Appeal> result = this.page(appealPage, wrapper);

        // 转换为 VO
        Page<AppealVO> voPage = new Page<>(result.getCurrent(), result.getSize(), result.getTotal());
        voPage.setRecords(result.getRecords().stream().map(this::convertToVO).toList());

        return voPage;
    }

    @Override
    public AppealVO convertToVO(Appeal appeal) {
        AppealVO vo = new AppealVO();
        BeanUtils.copyProperties(appeal, vo);
        return vo;
    }
}
