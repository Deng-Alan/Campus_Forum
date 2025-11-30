package com.campus.forum.controller;

import com.campus.forum.common.Result;
import com.campus.forum.service.UploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 文件上传控制器
 */
@RestController
@RequestMapping("/api/v1/upload")
@RequiredArgsConstructor
public class UploadController {

    private final UploadService uploadService;

    /**
     * 上传图片
     */
    @PostMapping("/image")
    public Result<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "post") String type) {

        Map<String, String> result = uploadService.uploadImage(file, type);
        return Result.success(result);
    }
}
