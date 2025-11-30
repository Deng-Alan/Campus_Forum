package com.campus.forum.controller;

import com.campus.forum.common.Result;
import com.campus.forum.dto.LoginDTO;
import com.campus.forum.dto.RegisterDTO;
import com.campus.forum.service.AuthService;
import com.campus.forum.vo.LoginVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

/**
 * 认证控制器
 */
@Api(tags = "认证管理")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @ApiOperation("用户登录")
    @PostMapping("/login")
    public Result<LoginVO> login(@RequestBody @Validated LoginDTO loginDTO) {
        LoginVO loginVO = authService.login(loginDTO);
        return Result.success("登录成功", loginVO);
    }

    @ApiOperation("用户注册")
    @PostMapping("/register")
    public Result<Void> register(@RequestBody @Validated RegisterDTO registerDTO) {
        authService.register(registerDTO);
        return Result.success("注册成功", null);
    }

    @ApiOperation("刷新令牌")
    @PostMapping("/refresh-token")
    public Result<LoginVO> refreshToken(@RequestParam String refreshToken) {
        LoginVO loginVO = authService.refreshToken(refreshToken);
        return Result.success(loginVO);
    }

    @ApiOperation("用户登出")
    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        authService.logout(token);
        return Result.success("登出成功", null);
    }

    @ApiOperation("获取验证码")
    @GetMapping("/captcha")
    public Result<Map<String, String>> getCaptcha() {
        String result = authService.getCaptcha();
        String[] parts = result.split("\\|");
        
        Map<String, String> data = new HashMap<>();
        data.put("image", parts[0]);
        data.put("key", parts[1]);
        
        return Result.success(data);
    }
}
