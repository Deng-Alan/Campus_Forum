package com.campus.forum.security;

import com.campus.forum.entity.UserProfile;
import com.campus.forum.mapper.UserProfileMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * 用户详情服务实现类
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserProfileMapper userProfileMapper;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserProfile user = userProfileMapper.selectByUsername(username);

        if (user == null) {
            log.warn("用户不存在: {}", username);
            throw new UsernameNotFoundException("用户不存在: " + username);
        }

        if (!"active".equalsIgnoreCase(user.getStatus())) {
            log.warn("用户已被禁用: {}", username);
            throw new UsernameNotFoundException("用户已被禁用: " + username);
        }

        // 获取用户角色
        List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().toUpperCase())
        );

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                true,
                true,
                true,
                true,
                authorities
        );
    }
}
