package com.happypath.dto.response;

import java.util.List;

public record SearchResultResponse(
        List<ContentResponse> contents,
        List<UserSummary> users,
        List<AlterEgoResponse> alterEgos
) {}
