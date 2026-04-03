package com.happypath.dto.request;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 100) String displayName,
        @Size(max = 300) String bio,
        String avatarUrl
) {}
