package com.campus.forum.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.campus.forum.common.ResultCode;
import com.campus.forum.entity.UserProfile;
import com.campus.forum.exception.BusinessException;
import com.campus.forum.mapper.UserProfileMapper;
import com.campus.forum.service.UserService;
import com.campus.forum.vo.UserVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 用户服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl extends ServiceImpl<UserProfileMapper, UserProfile> implements UserService {

    private final UserProfileMapper userProfileMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserProfile getByUsername(String username) {
        return userProfileMapper.selectByUsername(username);
    }

    @Override
    public UserProfile getByEmail(String email) {
        return userProfileMapper.selectByEmail(email);
    }

    @Override
    public UserVO getUserDetail(String userId) {
        UserProfile user = getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        UserVO userVO = new UserVO();
        BeanUtils.copyProperties(user, userVO);

        // TODO: 查询帖子数、获赞数、粉丝数等统计信息

        return userVO;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateUserInfo(String userId, UserVO userVO) {
        UserProfile user = getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 更新允许修改的字段
        if (userVO.getNickname() != null) {
            user.setNickname(userVO.getNickname());
        }
        if (userVO.getAvatar() != null) {
            user.setAvatar(userVO.getAvatar());
        }

        updateById(user);
        log.info("用户信息更新成功: userId={}", userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void changePassword(String userId, String oldPassword, String newPassword) {
        UserProfile user = getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new BusinessException(ResultCode.PASSWORD_ERROR, "原密码错误");
        }

        // 更新密码
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        updateById(user);
        log.info("用户密码修改成功: userId={}", userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateLoginInfo(String userId, String ip) {
        // user_profiles 表当前未存储登录 IP/时间，这里暂不持久化，仅保留方法以兼容接口
        log.debug("updateLoginInfo: userId={}, ip={}", userId, ip);
    }
}
