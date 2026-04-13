package com.happypath.dto.response;

import com.happypath.model.ContentStatus;
import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        String text,
        UserSummary author,
        AlterEgoResponse alterEgo,   // null se il commento è stato scritto come se stessi
        Long parentId,
        ContentStatus status,
        LocalDateTime createdAt
) {}
