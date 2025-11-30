package com.campus.forum.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.campus.forum.dto.CreatePostDTO;
import com.campus.forum.entity.Post;
import com.campus.forum.vo.PostVO;

import java.util.Map;

/**
 * 帖子服务接口
 */
public interface PostService extends IService<Post> {

    /**
     * 分页查询帖子列表
     *
     * @param page         页码
     * @param size         每页数量
     * @param type         帖子类型
     * @param subject      学科
     * @param reviewStatus 审核状态
     * @return 分页结果
     */
    Page<PostVO> getPostList(Integer page, Integer size, String type, String subject, String reviewStatus);

    /**
     * 获取帖子详情
     *
     * @param postId 帖子ID
     * @return 帖子VO
     */
    PostVO getPostDetail(String postId);

    /**
     * 创建帖子
     *
     * @param userId        当前用户ID
     * @param createPostDTO 创建帖子DTO
     * @return 创建结果（包含每日发帖计数信息）
     */
    Map<String, Object> createPost(String userId, CreatePostDTO createPostDTO);

    /**
     * 删除帖子
     *
     * @param userId 当前用户ID
     * @param postId 帖子ID
     */
    void deletePost(String userId, String postId);

    /**
     * 点赞帖子
     *
     * @param userId 当前用户ID
     * @param postId 帖子ID
     * @return 点赞后的点赞数
     */
    Integer likePost(String userId, String postId);

    /**
     * 获取我的帖子列表
     *
     * @param userId 当前用户ID
     * @param page   页码
     * @param size   每页数量
     * @return 分页结果
     */
    Page<PostVO> getMyPosts(String userId, Integer page, Integer size);

    /**
     * 将 Post 实体转换为 PostVO
     *
     * @param post Post实体
     * @return PostVO
     */
    PostVO convertToVO(Post post);
}
