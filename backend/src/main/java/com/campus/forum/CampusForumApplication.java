package com.campus.forum;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 校园论坛应用启动类
 * 
 * @author Campus Forum Team
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class CampusForumApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampusForumApplication.class, args);
        System.out.println("======================================");
        System.out.println("   Campus Forum Application Started   ");
        System.out.println("   武冈三中校园论坛服务已启动          ");
        System.out.println("======================================");
    }

}
