package com.happypath.dto.response;

import java.time.LocalDateTime;

public record UserReactionResponse(
        Long id,
        ContentSummary content,
        String reactionType,
        LocalDateTime createdAt
) {
    public record ContentSummary(Long id, String title, String mediaUrl) {}
}
