package com.campus.forum.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 文件上传服务接口
 */
public interface UploadService {

    /**
     * 上传图片
     *
     * @param file 图片文件
     * @param type 类型：avatar, post
     * @return 上传结果（包含url和filename）
     */
    Map<String, String> uploadImage(MultipartFile file, String type);
}
