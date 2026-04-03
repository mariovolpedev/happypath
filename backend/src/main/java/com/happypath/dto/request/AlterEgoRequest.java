package com.happypath.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AlterEgoRequest(
        @NotBlank @Size(max = 80) String name,
        @Size(max = 300) String description,
        String avatarUrl
) {}
