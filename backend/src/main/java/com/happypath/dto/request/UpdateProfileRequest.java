package com.happypath.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 100) String displayName,
        @Size(max = 300) String bio,
        String avatarUrl,
        /** Colore HEX opzionale per il profilo, es. "#22c55e" */
        @Pattern(regexp = "^#([A-Fa-f0-9]{6})$", message = "Il colore deve essere in formato HEX (#RRGGBB)")
        String profileColor
) {}
