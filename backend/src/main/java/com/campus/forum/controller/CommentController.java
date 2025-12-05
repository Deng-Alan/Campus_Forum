package com.campus.forum.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.forum.common.Result;
import com.campus.forum.dto.CreateCommentDTO;
import com.campus.forum.service.CommentService;
import com.campus.forum.service.UserService;
import com.campus.forum.vo.CommentVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Map;

/**
 * 评论控制器
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserService userService;

    /**
     * 获取帖子评论列表
     */
    @GetMapping("/posts/{postId}/comments")
    public Result<Map<String, Object>> getComments(
            @PathVariable String postId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {

        Page<CommentVO> result = commentService.getCommentsByPostId(postId, page, size);

        Map<String, Object> data = Map.of(
                "list", result.getRecords(),
                "total", result.getTotal(),
                "page", result.getCurrent(),
                "size", result.getSize()
        );

        return Result.success(data);
    }

    /**
     * 创建评论
     */
    @PostMapping("/posts/{postId}/comments")
    public Result<Void> createComment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String postId,
            @Valid @RequestBody CreateCommentDTO createCommentDTO) {

        var user = userService.getByUsername(userDetails.getUsername());
        String userId = user.getId();
        commentService.createComment(userId, postId, createCommentDTO);

        return Result.success();
    }

    /**
     * 删除评论
     */
    @DeleteMapping("/comments/{commentId}")
    public Result<Void> deleteComment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String commentId) {

        var user = userService.getByUsername(userDetails.getUsername());
        String userId = user.getId();
        commentService.deleteComment(userId, commentId);

        return Result.success();
    }

    /**
     * 点赞评论
     */
    @PostMapping("/comments/{commentId}/like")
    public Result<Map<String, Integer>> likeComment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String commentId) {

        var user = userService.getByUsername(userDetails.getUsername());
        String userId = user.getId();
        Integer likes = commentService.likeComment(userId, commentId);

        return Result.success(Map.of("likes", likes));
    }
}
