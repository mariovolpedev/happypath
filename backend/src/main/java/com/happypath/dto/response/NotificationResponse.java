package com.happypath.dto.response;

import com.happypath.model.Notification;
import com.happypath.model.NotificationType;
import java.time.LocalDateTime;

/**
 * DTO sent to the client both via REST (GET /notifications) and via STOMP WebSocket
 * push (destination: /user/{username}/queue/notifications).
 */
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
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getActor()   != null ? UserSummary.from(n.getActor()) : null,
                n.getType(),
                n.getContent() != null ? n.getContent().getId()    : null,
                n.getContent() != null ? n.getContent().getTitle() : null,
                n.getComment() != null ? n.getComment().getId()    : null,
                // Comment.text is the actual field name (not .body)
                n.getComment() != null ? truncate(n.getComment().getText(), 80) : null,
                n.isRead(),
                n.getCreatedAt()
        );
    }

    private static String truncate(String text, int maxLen) {
        if (text == null) return null;
        return text.length() <= maxLen ? text : text.substring(0, maxLen) + "\u2026";
    }
}
