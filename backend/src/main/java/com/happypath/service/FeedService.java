package com.happypath.service;

import com.happypath.dto.response.*;
import com.happypath.model.*;
import com.happypath.repository.*;
import com.happypath.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional(readOnly = true)
    public List<FeedItemResponse> getFeed(String username, int page, int size) {
        User me = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        FeedSettings settings = feedSettingsRepository.findByUser(me)
                .orElseGet(() -> FeedSettings.builder().user(me).build());

        // Guard: se sortStrategy è null (record non ancora persistito) usa SMART
        FeedSortStrategy strategy = settings.getSortStrategy() != null
                ? settings.getSortStrategy() : FeedSortStrategy.SMART;

        List<User> followedUsers = followRepository.findByFollower(me)
                .stream().map(Follow::getFollowed).toList();

        List<Long> followedThemeIds = themeFollowRepository.findFollowedThemeIdsByUser(me);

        List<FeedItemResponse> items = new ArrayList<>();

        if (settings.isShowContents() && (!followedUsers.isEmpty() || !followedThemeIds.isEmpty())) {
            List<Content> contents = contentRepository.findByAuthorsOrThemeIdsAndStatus(
                    followedUsers, followedThemeIds, ContentStatus.ACTIVE,
                    PageRequest.of(0, FEED_RAW_LIMIT)).getContent();

            // Bulk COUNT per reactions e comments — zero lazy-load
            List<Long> contentIds = contents.stream().map(Content::getId).toList();
            Map<Long, Long> reactionCounts = contentRepository.countReactionsByContentIds(contentIds);
            Map<Long, Long> commentCounts  = contentRepository.countCommentsByContentIds(contentIds);
            Map<Long, Map<String, Long>> reactionsByType = contentRepository.countReactionsByTypeForContentIds(contentIds);

            contents.forEach(c -> items.add(buildContentItem(c,
                    reactionCounts.getOrDefault(c.getId(), 0L),
                    commentCounts.getOrDefault(c.getId(), 0L),
                    reactionsByType.getOrDefault(c.getId(), Map.of()))));
        }

        if (settings.isShowComments() && !followedUsers.isEmpty()) {
            commentRepository.findByAuthorInAndStatusOrderByCreatedAtDesc(
                            followedUsers, ContentStatus.ACTIVE)
                    .forEach(c -> items.add(buildCommentItem(c)));
        }

        if (settings.isShowReactions() && !followedUsers.isEmpty()) {
            reactionRepository.findByUserInOrderByCreatedAtDesc(followedUsers)
                    .forEach(r -> items.add(buildReactionItem(r)));
        }

        if (settings.isShowFollowEvents() && !followedUsers.isEmpty()) {
            followRepository.findByFollowerIn(followedUsers)
                    .forEach(f -> items.add(buildFollowItem(f)));
        }

        return paginate(sortItems(items, strategy), page, size);
    }

    private List<FeedItemResponse> sortItems(List<FeedItemResponse> items, FeedSortStrategy strategy) {
        if (strategy == null) strategy = FeedSortStrategy.SMART;
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

    private List<FeedItemResponse> paginate(List<FeedItemResponse> sorted, int page, int size) {
        int from = page * size;
        if (from >= sorted.size()) return List.of();
        return sorted.subList(from, Math.min(from + size, sorted.size()));
    }

    private FeedItemResponse buildContentItem(Content c, long reactions, long comments, Map<String, Long> byType) {
        return new FeedItemResponse(FeedItem.CONTENT, toUserSummary(c.getAuthor()),
                toContentResponse(c, reactions, comments, byType), null, null, null,
                c.getCreatedAt(), smartScore(FeedItem.CONTENT, c.getCreatedAt()));
    }

    private FeedItemResponse buildCommentItem(Comment c) {
        // Per i commenti nel feed recuperiamo solo titolo/id del content — no lazy collection
        Content parent = c.getContent();
        long reactions = 0L, comments = 0L;
        Map<String, Long> byType = Map.of();
        if (parent != null) {
            List<Long> ids = List.of(parent.getId());
            reactions = contentRepository.countReactionsByContentIds(ids).getOrDefault(parent.getId(), 0L);
            comments  = contentRepository.countCommentsByContentIds(ids).getOrDefault(parent.getId(), 0L);
        }
        return new FeedItemResponse(FeedItem.COMMENT, toUserSummary(c.getAuthor()),
                toContentResponse(parent, reactions, comments, byType),
                toCommentResponse(c), null, null,
                c.getCreatedAt(), smartScore(FeedItem.COMMENT, c.getCreatedAt()));
    }

    private FeedItemResponse buildReactionItem(Reaction r) {
        Content parent = r.getContent();
        long reactions = 0L, comments = 0L;
        Map<String, Long> byType = Map.of();
        if (parent != null) {
            List<Long> ids = List.of(parent.getId());
            reactions = contentRepository.countReactionsByContentIds(ids).getOrDefault(parent.getId(), 0L);
            comments  = contentRepository.countCommentsByContentIds(ids).getOrDefault(parent.getId(), 0L);
        }
        return new FeedItemResponse(FeedItem.REACTION, toUserSummary(r.getUser()),
                toContentResponse(parent, reactions, comments, byType),
                null, r.getType().name(), null,
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
        return new UserSummary(u.getId(), u.getUsername(), u.getDisplayName(),
                u.getAvatarUrl(), u.getRole(), u.isVerified());
    }

    private ContentResponse toContentResponse(Content c, long reactions, long comments, Map<String, Long> byType) {
        if (c == null) return null;
        ThemeResponse theme = c.getTheme() == null ? null
                : new ThemeResponse(
                        c.getTheme().getId(), c.getTheme().getName(),
                        c.getTheme().getDescription(), c.getTheme().getIconEmoji(),
                        c.getTheme().isPreset(), 0L, false, c.getTheme().getCreatedAt());
        return new ContentResponse(
                c.getId(), c.getTitle(), c.getBody(), c.getMediaUrl(),
                toUserSummary(c.getAuthor()), null, theme,
                c.getStatus(), reactions, comments, byType, null,
                List.of(), c.getCreatedAt(), c.getUpdatedAt());
    }

    private CommentResponse toCommentResponse(Comment c) {
        if (c == null) return null;
        return new CommentResponse(
                c.getId(), c.getText(), toUserSummary(c.getAuthor()),
                null,
                c.getParent() != null ? c.getParent().getId() : null,
                c.getStatus(), c.getCreatedAt());
    }
}
