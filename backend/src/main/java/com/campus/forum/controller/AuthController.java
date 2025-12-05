package com.campus.forum.controller;

import com.campus.forum.common.Result;
import com.campus.forum.dto.ChangePasswordDTO;
import com.campus.forum.dto.LoginDTO;
import com.campus.forum.dto.RegisterDTO;
import com.campus.forum.service.AuthService;
import com.campus.forum.service.UserService;
import com.campus.forum.vo.LoginVO;
import com.campus.forum.vo.UserVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

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

    @ApiOperation("获取当前用户信息")
    @GetMapping("/me")
    public Result<UserVO> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        var user = userService.getByUsername(userDetails.getUsername());
        UserVO userVO = userService.getUserDetail(user.getId());
        return Result.success(userVO);
    }

    @ApiOperation("修改密码")
    @PutMapping("/password")
    public Result<Void> changePassword(@AuthenticationPrincipal UserDetails userDetails,
                                       @RequestBody @Validated ChangePasswordDTO dto) {
        var user = userService.getByUsername(userDetails.getUsername());
        userService.changePassword(user.getId(), dto.getOldPassword(), dto.getNewPassword());
        return Result.success("密码修改成功", null);
    }
}
