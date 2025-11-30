package com.campus.forum.service;

import com.campus.forum.vo.LeaderboardVO;

import java.util.List;

/**
 * 排行榜服务接口
 */
public interface LeaderboardService {

    /**
     * 获取学霸排行榜
     *
     * @param days    时间范围（7/30/365）
     * @param subject 学科筛选
     * @param limit   返回数量
     * @return 排行榜列表
     */
    List<LeaderboardVO> getStudyLeaderboard(Integer days, String subject, Integer limit);
}
