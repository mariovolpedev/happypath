package com.happypath.dto.response;

import com.happypath.model.ContentStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record ContentResponse(
        Long id,
        String title,
        String body,
        String mediaUrl,
        UserSummary author,
        AlterEgoResponse alterEgo,
        ThemeResponse theme,
        ContentStatus status,
        long reactionsCount,
        long commentsCount,
        Map<String, Long> reactionsByType,
        String myReaction,
        List<DedicationInfo> dedications,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
