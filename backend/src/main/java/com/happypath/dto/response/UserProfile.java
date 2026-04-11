package com.happypath.dto.response;

import com.happypath.model.UserRole;
import java.time.LocalDateTime;

public record UserProfile(
        Long id,
        String username,
        String displayName,
        String bio,
        String avatarUrl,
        String profileColor,
        UserRole role,
        boolean verified,
        long followersCount,
        long followingCount,
        boolean isFollowedByMe,
        boolean isBlockedByMe,
        LocalDateTime createdAt
) {}
