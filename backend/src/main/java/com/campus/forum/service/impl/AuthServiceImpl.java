package com.campus.forum.service.impl;

import cn.hutool.captcha.CaptchaUtil;
import cn.hutool.captcha.LineCaptcha;
import cn.hutool.core.util.IdUtil;
import com.campus.forum.common.ResultCode;
import com.campus.forum.dto.LoginDTO;
import com.campus.forum.dto.RegisterDTO;
import com.campus.forum.entity.UserProfile;
import com.campus.forum.exception.BusinessException;
import com.campus.forum.service.AuthService;
import com.campus.forum.service.UserService;
import com.campus.forum.util.JwtUtil;
import com.campus.forum.util.RedisUtil;
import com.campus.forum.vo.LoginVO;
import com.campus.forum.vo.UserVO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 认证服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final JwtUtil jwtUtil;
    private final RedisUtil redisUtil;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @Value("${jwt.expiration}")
    private Long expiration;

    @Value("${campus.captcha.enabled}")
    private Boolean captchaEnabled;

    @Value("${campus.captcha.expire}")
    private Integer captchaExpire;

    private static final String CAPTCHA_KEY_PREFIX = "captcha:";
    private static final String TOKEN_BLACKLIST_KEY = "token:blacklist:";

    @Override
    public LoginVO login(LoginDTO loginDTO) {
        // 验证验证码
        if (captchaEnabled) {
            validateCaptcha(loginDTO.getCaptchaKey(), loginDTO.getCaptcha());
        }

        // 根据用户名或邮箱获取用户信息
        String usernameOrEmail = loginDTO.getUsernameOrEmail();
        UserProfile user = userService.getByUsername(usernameOrEmail);
        if (user == null) {
            user = userService.getByEmail(usernameOrEmail);
        }
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 校验用户状态
        if (!"active".equalsIgnoreCase(user.getStatus())) {
            throw new BusinessException(ResultCode.ACCOUNT_DISABLED, "账号已被禁用");
        }

        // 校验密码
        if (!passwordEncoder.matches(loginDTO.getPassword(), user.getPasswordHash())) {
            throw new BusinessException(ResultCode.PASSWORD_ERROR, "用户名或密码错误");
        }

        // 生成 Token
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        // 更新登录信息
        userService.updateLoginInfo(user.getId(), null);

        // 构建用户 VO
        UserVO userVO = new UserVO();
        BeanUtils.copyProperties(user, userVO);

        log.info("用户登录成功: {}", user.getUsername());

        return LoginVO.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(expiration / 1000)
                .user(userVO)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void register(RegisterDTO registerDTO) {
        // 验证验证码
        if (captchaEnabled) {
            validateCaptcha(registerDTO.getCaptchaKey(), registerDTO.getCaptcha());
        }

        // 验证密码
        if (!registerDTO.getPassword().equals(registerDTO.getConfirmPassword())) {
            throw new BusinessException("两次输入的密码不一致");
        }

        // 检查用户名是否已存在
        if (userService.getByUsername(registerDTO.getUsername()) != null) {
            throw new BusinessException(ResultCode.USER_ALREADY_EXISTS, "用户名已存在");
        }

        // 检查邮箱是否已存在
        if (registerDTO.getEmail() != null && userService.getByEmail(registerDTO.getEmail()) != null) {
            throw new BusinessException(ResultCode.USER_ALREADY_EXISTS, "邮箱已被注册");
        }

        // 创建用户（基于 user_profiles 表）
        UserProfile user = new UserProfile();
        user.setUsername(registerDTO.getUsername());
        user.setNickname(registerDTO.getNickname());
        user.setEmail(registerDTO.getEmail());
        user.setPasswordHash(passwordEncoder.encode(registerDTO.getPassword()));
        user.setRole("user");
        user.setStatus("active");

        userService.save(user);
        log.info("用户注册成功: {}", user.getUsername());
    }

    @Override
    public LoginVO refreshToken(String refreshToken) {
        // 验证 Token
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new BusinessException(ResultCode.TOKEN_INVALID);
        }

        // 验证是否为 refresh token
        String tokenType = jwtUtil.getTokenType(refreshToken);
        if (!"refresh".equals(tokenType)) {
            throw new BusinessException(ResultCode.TOKEN_INVALID, "无效的刷新令牌");
        }

        // 获取用户 ID
        String userId = jwtUtil.getUserIdFromToken(refreshToken);
        UserProfile user = userService.getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 生成新的 Token
        String newAccessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getId());

        // 构建用户 VO
        UserVO userVO = new UserVO();
        BeanUtils.copyProperties(user, userVO);

        return LoginVO.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(expiration / 1000)
                .user(userVO)
                .build();
    }

    @Override
    public void logout(String accessToken) {
        if (accessToken != null && accessToken.startsWith("Bearer ")) {
            accessToken = accessToken.substring(7);
        }

        if (accessToken != null && jwtUtil.validateToken(accessToken)) {
            // 将 Token 加入黑名单
            long expireTime = jwtUtil.getExpirationFromToken(accessToken).getTime() - System.currentTimeMillis();
            if (expireTime > 0) {
                redisUtil.set(TOKEN_BLACKLIST_KEY + accessToken, "1", expireTime, TimeUnit.MILLISECONDS);
            }
            log.info("用户登出成功");
        }
    }

    @Override
    public String getCaptcha() {
        // 生成验证码
        LineCaptcha captcha = CaptchaUtil.createLineCaptcha(120, 40, 4, 30);
        String code = captcha.getCode();
        String key = IdUtil.simpleUUID();

        // 存入 Redis
        redisUtil.set(CAPTCHA_KEY_PREFIX + key, code, captchaExpire, TimeUnit.SECONDS);

        // 返回 Base64 图片和 key
        Map<String, String> result = new HashMap<>();
        result.put("key", key);
        result.put("image", captcha.getImageBase64Data());

        return captcha.getImageBase64Data() + "|" + key;
    }

    /**
     * 验证验证码
     */
    private void validateCaptcha(String key, String code) {
        if (key == null || code == null) {
            throw new BusinessException(ResultCode.CAPTCHA_ERROR, "请输入验证码");
        }

        String redisKey = CAPTCHA_KEY_PREFIX + key;
        Object cachedCode = redisUtil.get(redisKey);

        if (cachedCode == null) {
            throw new BusinessException(ResultCode.CAPTCHA_EXPIRED);
        }

        if (!code.equalsIgnoreCase(cachedCode.toString())) {
            throw new BusinessException(ResultCode.CAPTCHA_ERROR);
        }

        // 验证成功后删除验证码
        redisUtil.delete(redisKey);
    }
}
