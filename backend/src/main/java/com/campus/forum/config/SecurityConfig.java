package com.campus.forum.config;

import com.campus.forum.security.JwtAccessDeniedHandler;
import com.campus.forum.security.JwtAuthenticationEntryPoint;
import com.campus.forum.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security 配置类
 */
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAccessDeniedHandler jwtAccessDeniedHandler;

    /**
     * 白名单路径（无需认证）
     */
    private static final String[] WHITE_LIST = {
            // 认证相关
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/captcha",
            "/api/v1/auth/refresh-token",
            
            // Swagger 文档
            "/doc.html",
            "/swagger-resources/**",
            "/webjars/**",
            "/v2/api-docs",
            "/v3/api-docs/**",
            
            // 静态资源
            "/favicon.ico",
            "/error",
            "/uploads/**",
            
            // 健康检查
            "/actuator/**"
    };

    /**
     * 公开访问路径（只读，无需认证）
     */
    private static final String[] PUBLIC_GET_PATHS = {
            "/api/v1/posts",
            "/api/v1/posts/*",
            "/api/v1/posts/*/comments",
            "/api/v1/announcements",
            "/api/v1/leaderboard/study",
            "/api/v1/users/*",
            "/api/v1/users/*/profile"
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 禁用 CSRF (因为使用 JWT)
                .csrf().disable()
                
                // 禁用 Session
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                
                // 异常处理
                .exceptionHandling()
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                .accessDeniedHandler(jwtAccessDeniedHandler)
                .and()
                
                // 请求授权配置
                .authorizeRequests()
                // 白名单路径
                .antMatchers(WHITE_LIST).permitAll()
                // 公开 GET 请求
                .antMatchers(HttpMethod.GET, PUBLIC_GET_PATHS).permitAll()
                // OPTIONS 请求放行
                .antMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // 管理员接口
                .antMatchers("/api/v1/admin/**").hasRole("ADMIN")
                // 其他请求需要认证
                .anyRequest().authenticated()
                .and()
                
                // 添加 JWT 过滤器
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                
                // 禁用缓存
                .headers()
                .cacheControl();

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}
