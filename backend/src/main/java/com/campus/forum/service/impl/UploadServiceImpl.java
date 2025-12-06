package com.campus.forum.service.impl;

import cn.hutool.core.util.IdUtil;
import com.campus.forum.common.ResultCode;
import com.campus.forum.exception.BusinessException;
import com.campus.forum.service.UploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

/**
 * 文件上传服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UploadServiceImpl implements UploadService {

    @Value("${campus.upload.path:uploads}")
    private String uploadPath;

    @Value("${campus.upload.base-url:http://localhost:8080}")
    private String baseUrl;

    private static final long MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
    private static final long MAX_POST_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final String[] ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"};

    @Override
    public Map<String, String> uploadImage(MultipartFile file, String type) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "文件不能为空");
        }

        // 验证文件大小
        long maxSize = "avatar".equals(type) ? MAX_AVATAR_SIZE : MAX_POST_IMAGE_SIZE;
        if (file.getSize() > maxSize) {
            throw new BusinessException(ResultCode.FILE_SIZE_EXCEEDED,
                    "文件大小超过限制（" + (maxSize / 1024 / 1024) + "MB）");
        }

        // 验证文件类型
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "文件名无效");
        }

        String extension = getFileExtension(originalFilename);
        if (!isAllowedExtension(extension)) {
            throw new BusinessException(ResultCode.BAD_REQUEST,
                    "不支持的文件格式，仅支持: " + Arrays.toString(ALLOWED_EXTENSIONS));
        }

        // 生成文件名
        String filename = IdUtil.simpleUUID() + "." + extension;
        String relativePath = type + "/" + filename;

        try {
            // 计算上传根目录（转换为绝对路径），并在其下创建子目录
            Path rootPath = Paths.get(uploadPath).toAbsolutePath().normalize();
            Path uploadDir = rootPath.resolve(type);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // 保存文件
            Path filePath = uploadDir.resolve(filename);
            file.transferTo(filePath.toFile());

            log.info("文件上传成功: {}", relativePath);

            // 返回结果
            Map<String, String> result = new HashMap<>();
            result.put("url", baseUrl + "/uploads/" + relativePath);
            result.put("filename", filename);

            return result;
        } catch (IOException e) {
            log.error("文件上传失败", e);
            throw new BusinessException(ResultCode.ERROR, "文件上传失败");
        }
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0) {
            return filename.substring(lastDotIndex + 1).toLowerCase();
        }
        return "";
    }

    /**
     * 检查是否为允许的文件扩展名
     */
    private boolean isAllowedExtension(String extension) {
        return Arrays.asList(ALLOWED_EXTENSIONS).contains(extension.toLowerCase());
    }
}
