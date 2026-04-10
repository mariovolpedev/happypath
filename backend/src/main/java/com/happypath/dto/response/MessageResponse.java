package com.happypath.dto.response;

import java.time.LocalDateTime;

/**
 * Full message payload sent to the client.
 *
 * <p>When a message contains an attachment, one of {@code attachedContent} or
 * {@code attachedUser} will be populated; the other will be null.</p>
 */
public record MessageResponse(
        Long id,
        UserSummary sender,
        UserSummary recipient,
        String text,
        boolean readByRecipient,
        LocalDateTime sentAt,
        /** Populated when the sender attached a content card. */
        ContentSummary attachedContent,
        /** Populated when the sender shared a profile. */
        UserSummary attachedUser
) {
    /**
     * Lightweight content summary used inside messages so we don't embed
     * the full ContentResponse (with all reactions, comments, etc.).
     */
    public record ContentSummary(
            Long id,
            String title,
            String body,
            String mediaUrl,
            UserSummary author,
            String themeName,
            String themeEmoji
    ) {}
}
