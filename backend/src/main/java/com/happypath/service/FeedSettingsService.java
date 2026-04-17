package com.happypath.service;

import com.happypath.dto.request.FeedSettingsRequest;
import com.happypath.dto.response.FeedSettingsResponse;
import com.happypath.exception.ResourceNotFoundException;
import com.happypath.model.FeedSettings;
import com.happypath.model.FeedSortStrategy;
import com.happypath.model.User;
import com.happypath.repository.FeedSettingsRepository;
import com.happypath.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FeedSettingsService {

    private final FeedSettingsRepository feedSettingsRepository;
    private final UserRepository userRepository;

    public FeedSettingsResponse getSettings(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        FeedSettings settings = feedSettingsRepository.findByUser(user)
                .orElseGet(() -> FeedSettings.builder().user(user).build());
        return toResponse(settings);
    }

    @Transactional
    public FeedSettingsResponse updateSettings(String username, FeedSettingsRequest req) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        FeedSettings settings = feedSettingsRepository.findByUser(user)
                .orElseGet(() -> FeedSettings.builder().user(user).build());

        settings.setShowContents(req.showContents());
        settings.setShowComments(req.showComments());
        settings.setShowReactions(req.showReactions());
        settings.setShowFollowEvents(req.showFollowEvents());
        // Guard: se il client non invia sortStrategy (o invia null), mantieni il valore attuale
        // oppure usa SMART come default sicuro
        FeedSortStrategy strategy = req.sortStrategy() != null
                ? req.sortStrategy()
                : (settings.getSortStrategy() != null ? settings.getSortStrategy() : FeedSortStrategy.SMART);
        settings.setSortStrategy(strategy);

        return toResponse(feedSettingsRepository.save(settings));
    }

    private FeedSettingsResponse toResponse(FeedSettings s) {
        return new FeedSettingsResponse(
                s.isShowContents(),
                s.isShowComments(),
                s.isShowReactions(),
                s.isShowFollowEvents(),
                s.getSortStrategy() != null ? s.getSortStrategy() : FeedSortStrategy.SMART
        );
    }
}
