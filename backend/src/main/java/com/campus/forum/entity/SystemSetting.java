package com.campus.forum.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * system_settings 表实体
 */
@Data
@TableName("system_settings")
public class SystemSetting {

    /**
     * 设置键名
     */
    @TableId
    private String key;

    /**
     * 设置值
     */
    private String value;

    /**
     * 设置说明
     */
    private String description;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
