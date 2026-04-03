package com.happypath.dto.request;

import com.happypath.model.BanDuration;

public record ModerationRequest(
        String note,
        BanDuration banDuration
) {}
