package com.happypath.dto.response;

import com.happypath.model.NotificationType;
import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        UserSummary actor,
        NotificationType type,
        Long contentId,
        String contentTitle,
        Long commentId,
        String commentPreview,
        boolean read,
        LocalDateTime createdAt
) {}
