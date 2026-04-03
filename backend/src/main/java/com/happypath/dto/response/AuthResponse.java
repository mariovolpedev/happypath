package com.happypath.dto.response;

public record AuthResponse(
        String token,
        UserSummary user
) {}
