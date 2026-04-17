package com.happypath.dto.response;

import java.time.LocalDateTime;

public record ThemeResponse(
        Long id,
        String name,
        String description,
        String iconEmoji,
        boolean preset,
        long followersCount,
        boolean followedByMe,
        LocalDateTime createdAt
) {}
