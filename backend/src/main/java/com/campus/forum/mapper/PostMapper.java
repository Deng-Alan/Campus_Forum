package com.campus.forum.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.campus.forum.entity.Post;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

/**
 * Post Mapper
 */
@Mapper
public interface PostMapper extends BaseMapper<Post> {

    /**
     * 分页查询帖子列表（含复杂条件）
     */
    @Select("<script>" +
            "SELECT * FROM posts " +
            "WHERE 1=1 " +
            "<if test='type != null'> AND type = #{type} </if>" +
            "<if test='subject != null'> AND subject = #{subject} </if>" +
            "<if test='reviewStatus != null'> AND review_status = #{reviewStatus} </if>" +
            "<if test='status != null'> AND status = #{status} </if>" +
            "ORDER BY " +
            "<if test='isFeatured != null and isFeatured == true'> is_featured DESC, </if>" +
            "created_at DESC" +
            "</script>")
    IPage<Post> selectPostPage(Page<Post> page,
                                @Param("type") String type,
                                @Param("subject") String subject,
                                @Param("reviewStatus") String reviewStatus,
                                @Param("status") String status,
                                @Param("isFeatured") Boolean isFeatured);
}
