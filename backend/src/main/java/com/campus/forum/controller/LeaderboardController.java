package com.campus.forum.controller;

import com.campus.forum.common.Result;
import com.campus.forum.service.LeaderboardService;
import com.campus.forum.vo.LeaderboardVO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 排行榜控制器
 */
@RestController
@RequestMapping("/api/v1/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    /**
     * 获取学霸排行榜
     */
    @GetMapping("/study")
    public Result<List<LeaderboardVO>> getStudyLeaderboard(
            @RequestParam(defaultValue = "7") Integer days,
            @RequestParam(required = false) String subject,
            @RequestParam(defaultValue = "10") Integer limit) {

        List<LeaderboardVO> leaderboard = leaderboardService.getStudyLeaderboard(days, subject, limit);
        return Result.success(leaderboard);
    }
}
