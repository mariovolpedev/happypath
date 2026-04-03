package com.happypath.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MessageRequest(
        @NotNull Long recipientId,
        @NotBlank String text
) {}
