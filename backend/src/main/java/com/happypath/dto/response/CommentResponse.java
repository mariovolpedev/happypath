package com.happypath.dto.response;

import com.happypath.model.ContentStatus;
import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        String text,
        UserSummary author,
        Long parentId,
        ContentStatus status,
        LocalDateTime createdAt
) {}
