package com.happypath.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Richiesta per la creazione di un nuovo tema personalizzato.
 * I temi predefiniti (preset) sono gestiti solo via data.sql/admin.
 */
public record ThemeCreateRequest(
        @NotBlank @Size(max = 80) String name,
        @Size(max = 200) String description,
        String iconEmoji
) {}
