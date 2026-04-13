package com.happypath.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MessageRequest(
        @NotNull Long recipientId,
        @NotBlank @Size(max = 2000) String text,
        Long senderAlterEgoId,     // opzionale: se presente, il messaggio viene inviato come alter ego
        Long attachedContentId,
        Long attachedUserId
) {}
