package com.happypath.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MessageRequest(
        @NotNull Long recipientId,
        @NotBlank @Size(max = 2000) String text,
        /** Optional: attach a content card by ID */
        Long attachedContentId,
        /** Optional: attach a user profile by ID */
        Long attachedUserId
) {}
