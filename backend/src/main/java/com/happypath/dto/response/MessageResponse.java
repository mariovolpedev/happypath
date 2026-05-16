package com.happypath.dto.response;

import java.time.LocalDateTime;

public record MessageResponse(
        Long id,
        UserSummary sender,
        AlterEgoResponse senderAlterEgo,   // null se inviato come se stessi
        UserSummary recipient,
        String text,
        boolean readByRecipient,
        LocalDateTime sentAt,
        ContentSummary attachedContent,
        UserSummary attachedUser,
        /** URL MinIO dell'immagine allegata al messaggio (null se assente). */
        String imageUrl
) {
    /**
     * Lightweight content summary embedded inside messages.
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
