package com.campus.forum.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.forum.common.Result;
import com.campus.forum.dto.CreatePostDTO;
import com.campus.forum.service.PostService;
import com.campus.forum.vo.PostVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

/**
 * 帖子控制器
 */
@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    /**
     * 获取帖子列表
     */
    @GetMapping
    public Result<Map<String, Object>> getPostList(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) String reviewStatus) {

        Page<PostVO> result = postService.getPostList(page, size, type, subject, reviewStatus);

        Map<String, Object> data = Map.of(
                "list", result.getRecords(),
                "total", result.getTotal(),
                "page", result.getCurrent(),
                "size", result.getSize(),
                "pages", result.getPages()
        );

        return Result.success(data);
    }

    /**
     * 获取帖子详情
     */
    @GetMapping("/{postId}")
    public Result<PostVO> getPostDetail(@PathVariable String postId) {
        PostVO post = postService.getPostDetail(postId);
        return Result.success(post);
    }

    /**
     * 创建帖子
     */
    @PostMapping
    public Result<Map<String, Object>> createPost(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreatePostDTO createPostDTO) {

        String userId = userDetails.getUsername();
        Map<String, Object> result = postService.createPost(userId, createPostDTO);

        return Result.success("发布成功，已提交审核", result);
    }

    /**
     * 删除帖子
     */
    @DeleteMapping("/{postId}")
    public Result<Void> deletePost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String postId) {

        String userId = userDetails.getUsername();
        postService.deletePost(userId, postId);

        return Result.success();
    }

    /**
     * 点赞帖子
     */
    @PostMapping("/{postId}/like")
    public Result<Map<String, Integer>> likePost(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String postId) {

        String userId = userDetails.getUsername();
        Integer likes = postService.likePost(userId, postId);

        return Result.success(Map.of("likes", likes));
    }

    /**
     * 获取我的帖子
     */
    @GetMapping("/my")
    public Result<Map<String, Object>> getMyPosts(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {

        String userId = userDetails.getUsername();
        Page<PostVO> result = postService.getMyPosts(userId, page, size);

        Map<String, Object> data = Map.of(
                "list", result.getRecords(),
                "total", result.getTotal(),
                "page", result.getCurrent(),
                "size", result.getSize()
        );

        return Result.success(data);
    }
}
