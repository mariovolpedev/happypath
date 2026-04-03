package com.happypath.dto.response;

public record AlterEgoResponse(Long id, String name, String description, String avatarUrl, UserSummary owner) {}
