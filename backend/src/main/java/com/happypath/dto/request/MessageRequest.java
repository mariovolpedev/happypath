package com.happypath.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MessageRequest(
        @NotNull Long recipientId,
        @Size(max = 2000) String text,
        Long senderAlterEgoId,     // opzionale: se presente, il messaggio viene inviato come alter ego
        Long attachedContentId,
        Long attachedUserId,
        /** URL MinIO di un'immagine allegata al messaggio (opzionale). */
        String imageUrl
) {}
