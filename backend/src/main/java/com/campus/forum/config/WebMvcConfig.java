package com.campus.forum.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC 配置
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${campus.upload.path}")
    private String uploadPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 计算上传目录绝对路径，确保与 UploadServiceImpl 保存路径一致
        String uploadLocation = java.nio.file.Paths.get(uploadPath)
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();

        // 上传文件访问路径
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadLocation);

        // Swagger 资源
        registry.addResourceHandler("doc.html")
                .addResourceLocations("classpath:/META-INF/resources/");
        registry.addResourceHandler("/webjars/**")
                .addResourceLocations("classpath:/META-INF/resources/webjars/");
    }
}
