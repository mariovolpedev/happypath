package com.happypath.dto.response;

import com.happypath.model.UserRole;

public record UserSummary(
        Long id,
        String username,
        String displayName,
        String avatarUrl,
        UserRole role,
        boolean verified
) {}
