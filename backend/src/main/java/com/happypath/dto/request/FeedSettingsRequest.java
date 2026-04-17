package com.happypath.dto.request;

import com.happypath.model.FeedSortStrategy;

public record FeedSettingsRequest(
        boolean showContents,
        boolean showComments,
        boolean showReactions,
        boolean showFollowEvents,
        FeedSortStrategy sortStrategy
) {}
