package com.happypath.service;

import com.happypath.dto.response.*;
import com.happypath.model.*;
import com.happypath.repository.*;
import com.happypath.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedService {

    private static final int FEED_RAW_LIMIT = 200;
    private static final Map<FeedItem, Double> BASE_WEIGHT = Map.of(
            FeedItem.CONTENT,      10.0,
            FeedItem.COMMENT,       8.0,
            FeedItem.REACTION,      5.0,
            FeedItem.FOLLOW_EVENT,  4.0
    );

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final ThemeFollowRepository themeFollowRepository;
    private final ContentRepository contentRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final FeedSettingsRepository feedSettingsRepository;

    public List<FeedItemResponse> getFeed(String username, int page, int size) {
        User me = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        FeedSettings settings = feedSettingsRepository.findByUser(me)
                .orElseGet(() -> FeedSettings.builder().user(me).build());

        List<User> followedUsers = followRepository.findByFollower(me)
                .stream().map(Follow::getFollowed).toList();

        List<Long> followedThemeIds = themeFollowRepository.findFollowedThemeIdsByUser(me);

        List<FeedItemResponse> items = new ArrayList<>();

        if (settings.isShowContents() && (!followedUsers.isEmpty() || !followedThemeIds.isEmpty())) {
            List<User> authors = followedUsers.isEmpty() ? List.of() : followedUsers;
            List<Long> themeIds = followedThemeIds.isEmpty() ? List.of() : followedThemeIds;
            contentRepository.findByAuthorsOrThemeIdsAndStatus(
                            authors, themeIds, ContentStatus.ACTIVE,
                            PageRequest.of(0, FEED_RAW_LIMIT))
                    .forEach(c -> items.add(buildContentItem(c)));
        }

        if (settings.isShowComments() && !followedUsers.isEmpty()) {
            commentRepository.findByAuthorInAndStatusOrderByCreatedAtDesc(
                            followedUsers, CommentStatus.ACTIVE,
                            PageRequest.of(0, FEED_RAW_LIMIT))
                    .forEach(c -> items.add(buildCommentItem(c)));
        }

        if (settings.isShowReactions() && !followedUsers.isEmpty()) {
            reactionRepository.findByUserInOrderByCreatedAtDesc(
                            followedUsers,
                            PageRequest.of(0, FEED_RAW_LIMIT))
                    .forEach(r -> items.add(buildReactionItem(r)));
        }

        if (settings.isShowFollowEvents() && !followedUsers.isEmpty()) {
            followRepository.findByFollowerIn(followedUsers)
                    .forEach(f -> items.add(buildFollowItem(f)));
        }

        List<FeedItemResponse> sorted = sortItems(items, settings.getSortStrategy());

        int from = page * size;
        int to = Math.min(from + size, sorted.size());
        if (from >= sorted.size()) return List.of();
        return sorted.subList(from, to);
    }

    private List<FeedItemResponse> sortItems(List<FeedItemResponse> items, FeedSortStrategy strategy) {
        return switch (strategy) {
            case RECENT -> items.stream()
                    .sorted(Comparator.comparing(FeedItemResponse::eventAt).reversed())
                    .toList();
            case RANDOM -> {
                List<FeedItemResponse> shuffled = new ArrayList<>(items);
                Collections.shuffle(shuffled);
                yield shuffled;
            }
            case SMART -> items.stream()
                    .sorted(Comparator.comparingDouble(FeedItemResponse::score).reversed())
                    .toList();
        };
    }

    private FeedItemResponse buildContentItem(Content c) {
        return new FeedItemResponse(FeedItem.CONTENT, toUserSummary(c.getAuthor()),
                toContentResponse(c), null, null, null, c.getCreatedAt(),
                smartScore(FeedItem.CONTENT, c.getCreatedAt()));
    }

    private FeedItemResponse buildCommentItem(Comment c) {
        return new FeedItemResponse(FeedItem.COMMENT, toUserSummary(c.getAuthor()),
                toContentResponse(c.getContent()), toCommentResponse(c), null, null,
                c.getCreatedAt(), smartScore(FeedItem.COMMENT, c.getCreatedAt()));
    }

    private FeedItemResponse buildReactionItem(Reaction r) {
        return new FeedItemResponse(FeedItem.REACTION, toUserSummary(r.getUser()),
                toContentResponse(r.getContent()), null, r.getType().name(), null,
                r.getCreatedAt(), smartScore(FeedItem.REACTION, r.getCreatedAt()));
    }

    private FeedItemResponse buildFollowItem(Follow f) {
        return new FeedItemResponse(FeedItem.FOLLOW_EVENT, toUserSummary(f.getFollower()),
                null, null, null, toUserSummary(f.getFollowed()),
                f.getCreatedAt(), smartScore(FeedItem.FOLLOW_EVENT, f.getCreatedAt()));
    }

    private double smartScore(FeedItem type, LocalDateTime eventAt) {
        double base = BASE_WEIGHT.getOrDefault(type, 5.0);
        long hours = ChronoUnit.HOURS.between(eventAt, LocalDateTime.now());
        double recency = 10.0 * Math.exp(-hours / 48.0);
        double jitter = Math.random() * 2.0;
        return base + recency + jitter;
    }

    private UserSummary toUserSummary(User u) {
        if (u == null) return null;
        return new UserSummary(u.getId(), u.getUsername(), u.getDisplayName(), u.getAvatarUrl(), u.getRole(), u.isVerified());
    }

    private ContentResponse toContentResponse(Content c) {
        if (c == null) return null;
        long reactions = c.getReactions().size();
        long comments = c.getComments().size();
        Map<String, Long> byType = c.getReactions().stream()
                .collect(Collectors.groupingBy(r -> r.getType().name(), Collectors.counting()));
        ThemeResponse theme = c.getTheme() == null ? null
                : new ThemeResponse(c.getTheme().getId(), c.getTheme().getName(),
                c.getTheme().getDescription(), c.getTheme().getIconEmoji(),
                c.getTheme().isPreset(), 0, false, c.getTheme().getCreatedAt());
        return new ContentResponse(
                c.getId(), c.getTitle(), c.getBody(), c.getMediaUrl(),
                toUserSummary(c.getAuthor()), null, theme,
                c.getStatus(), reactions, comments, byType, null,
                List.of(), c.getCreatedAt(), c.getUpdatedAt()
        );
    }

    private CommentResponse toCommentResponse(Comment c) {
        if (c == null) return null;
        return new CommentResponse(c.getId(), toUserSummary(c.getAuthor()), c.getBody(), c.getCreatedAt());
    }
}
