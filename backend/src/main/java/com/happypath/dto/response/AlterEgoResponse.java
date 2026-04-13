package com.happypath.dto.response;

import java.time.LocalDateTime;

public record AlterEgoResponse(
        Long id,
        String name,
        String description,
        String avatarUrl,
        UserSummary owner,
        LocalDateTime createdAt
) {}
