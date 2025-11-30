package com.campus.forum.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.campus.forum.common.Result;
import com.campus.forum.common.ResultCode;
import com.campus.forum.entity.UserPreference;
import com.campus.forum.exception.BusinessException;
import com.campus.forum.mapper.UserPreferenceMapper;
import com.campus.forum.service.UserService;
import com.campus.forum.vo.UserVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * 用户控制器
 */
@Api(tags = "用户管理")
@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserPreferenceMapper userPreferenceMapper;

    @ApiOperation("获取当前用户信息")
    @GetMapping("/me")
    public Result<UserVO> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        // 通过 UserDetails 获取用户名，再查询用户信息
        var user = userService.getByUsername(userDetails.getUsername());
        UserVO userVO = userService.getUserDetail(user.getId());
        return Result.success(userVO);
    }

    @ApiOperation("获取用户详情")
    @GetMapping("/{id}")
    public Result<UserVO> getUserDetail(@PathVariable String id) {
        UserVO userVO = userService.getUserDetail(id);
        return Result.success(userVO);
    }

    @ApiOperation("获取用户公开资料")
    @GetMapping("/{id}/profile")
    public Result<UserVO> getUserProfile(@PathVariable String id) {
        UserVO userVO = userService.getUserDetail(id);
        // 只返回公开信息
        userVO.setEmail(null);
        userVO.setPhone(null);
        return Result.success(userVO);
    }

    @ApiOperation("更新用户信息")
    @PutMapping("/me")
    public Result<Void> updateUserInfo(@AuthenticationPrincipal UserDetails userDetails,
                                       @RequestBody UserVO userVO) {
        var user = userService.getByUsername(userDetails.getUsername());
        userService.updateUserInfo(user.getId(), userVO);
        return Result.success("更新成功", null);
    }

    @ApiOperation("修改密码")
    @PutMapping("/me/password")
    public Result<Void> changePassword(@AuthenticationPrincipal UserDetails userDetails,
                                       @RequestParam String oldPassword,
                                       @RequestParam String newPassword) {
        var user = userService.getByUsername(userDetails.getUsername());
        userService.changePassword(user.getId(), oldPassword, newPassword);
        return Result.success("密码修改成功", null);
    }

    @ApiOperation("获取用户偏好设置")
    @GetMapping("/preferences")
    public Result<Map<String, Boolean>> getPreferences(@AuthenticationPrincipal UserDetails userDetails) {
        var user = userService.getByUsername(userDetails.getUsername());
        UserPreference pref = userPreferenceMapper.selectOne(
                new QueryWrapper<UserPreference>().eq("user_id", user.getId()));
        boolean isAnonymous = pref != null && Boolean.TRUE.equals(pref.getIsAnonymous());
        Map<String, Boolean> data = new HashMap<>();
        data.put("isAnonymous", isAnonymous);
        return Result.success(data);
    }

    @ApiOperation("更新用户偏好设置")
    @PutMapping("/preferences")
    public Result<Void> updatePreferences(@AuthenticationPrincipal UserDetails userDetails,
                                          @RequestBody Map<String, Boolean> body) {
        var user = userService.getByUsername(userDetails.getUsername());
        Boolean isAnonymous = body.get("isAnonymous");
        if (isAnonymous == null) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "isAnonymous 参数不能为空");
        }

        UserPreference pref = userPreferenceMapper.selectOne(
                new QueryWrapper<UserPreference>().eq("user_id", user.getId()));
        if (pref == null) {
            pref = new UserPreference();
            pref.setUserId(user.getId());
            pref.setIsAnonymous(isAnonymous);
            userPreferenceMapper.insert(pref);
        } else {
            pref.setIsAnonymous(isAnonymous);
            userPreferenceMapper.updateById(pref);
        }

        return Result.success("更新成功", null);
    }
}
