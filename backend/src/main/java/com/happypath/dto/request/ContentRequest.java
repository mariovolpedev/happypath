package com.happypath.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContentRequest(
        @NotBlank @Size(max = 200) String title,
        String body,
        String mediaUrl,
        Long themeId,
        Long alterEgoId,
        Long dedicatedToUserId
) {}
