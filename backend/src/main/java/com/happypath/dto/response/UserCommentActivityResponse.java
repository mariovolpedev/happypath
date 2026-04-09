package com.happypath.dto.response;

import com.happypath.model.ContentStatus;
import java.time.LocalDateTime;

public record UserCommentActivityResponse(
        Long id,
        String text,
        ContentSummary content,
        ContentStatus status,
        LocalDateTime createdAt
) {
    public record ContentSummary(Long id, String title) {}
}
