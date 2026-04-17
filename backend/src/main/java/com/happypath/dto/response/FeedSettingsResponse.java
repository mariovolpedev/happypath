package com.happypath.dto.response;

import com.happypath.model.FeedSortStrategy;

public record FeedSettingsResponse(
        boolean showContents,
        boolean showComments,
        boolean showReactions,
        boolean showFollowEvents,
        FeedSortStrategy sortStrategy
) {}
