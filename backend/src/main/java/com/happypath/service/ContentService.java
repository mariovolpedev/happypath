package com.happypath.service;

import com.happypath.dto.request.ContentRequest;
import com.happypath.dto.response.*;
import com.happypath.exception.HappyPathException;
import com.happypath.model.*;
import com.happypath.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository  contentRepository;
    private final ThemeRepository    themeRepository;
    private final AlterEgoRepository alterEgoRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository  commentRepository;
    private final UserRepository     userRepository;
    private final UserService        userService;
    @Lazy
    private final AlterEgoService    alterEgoService;

    public Content findById(Long id) {
        return contentRepository.findById(id)
                .orElseThrow(() ->
                        new HappyPathException("Contenuto non trovato", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public ContentResponse create(ContentRequest req, User author) {
        Content.ContentBuilder builder = Content.builder()
                .title(req.title())
                .body(req.body())
                .mediaUrl(req.mediaUrl())
                .author(author);

        if (req.themeId() != null)
            builder.theme(themeRepository.findById(req.themeId())
                    .orElseThrow(() ->
                            new HappyPathException("Tema non trovato", HttpStatus.NOT_FOUND)));

        if (req.alterEgoId() != null) {
            if (!author.isVerified())
                throw new HappyPathException(
                        "Solo gli utenti verificati possono usare un Alter Ego", HttpStatus.FORBIDDEN);
            AlterEgo ae = alterEgoRepository.findById(req.alterEgoId())
                    .orElseThrow(() ->
                            new HappyPathException("Alter Ego non trovato", HttpStatus.NOT_FOUND));
            if (!ae.getOwner().getId().equals(author.getId()))
                throw new HappyPathException(
                        "Non sei il proprietario di questo Alter Ego", HttpStatus.FORBIDDEN);
            builder.alterEgo(ae);
        }

        Content content = contentRepository.save(builder.build());
        // single item — query dirette vanno bene
        return toResponseSingle(content, author);
    }

    @Transactional
    public ContentResponse update(Long id, ContentRequest req, User user) {
        Content content = findById(id);
        if (!content.getAuthor().getId().equals(user.getId()) && !isModeratorOrAdmin(user))
            throw new HappyPathException("Non autorizzato", HttpStatus.FORBIDDEN);

        if (req.title()    != null) content.setTitle(req.title());
        if (req.body()     != null) content.setBody(req.body());
        if (req.mediaUrl() != null) content.setMediaUrl(req.mediaUrl());
        if (req.themeId()  != null)
            content.setTheme(themeRepository.findById(req.themeId()).orElse(null));

        return toResponseSingle(contentRepository.save(content), user);
    }

    @Transactional
    public ContentResponse changePublisher(Long contentId, User requester, Long alterEgoId) {
        Content content = findById(contentId);
        if (!content.getAuthor().getId().equals(requester.getId()))
            throw new HappyPathException("Non autorizzato", HttpStatus.FORBIDDEN);

        if (alterEgoId == null) {
            content.setAlterEgo(null);
        } else {
            if (!requester.isVerified())
                throw new HappyPathException(
                        "Solo gli utenti verificati possono usare un Alter Ego", HttpStatus.FORBIDDEN);
            AlterEgo ae = alterEgoRepository.findById(alterEgoId)
                    .orElseThrow(() ->
                            new HappyPathException("Alter Ego non trovato", HttpStatus.NOT_FOUND));
            if (!ae.getOwner().getId().equals(requester.getId()))
                throw new HappyPathException(
                        "Non sei il proprietario di questo Alter Ego", HttpStatus.FORBIDDEN);
            content.setAlterEgo(ae);
        }
        return toResponseSingle(contentRepository.save(content), requester);
    }

    @Transactional
    public void delete(Long id, User user) {
        Content content = findById(id);
        if (!content.getAuthor().getId().equals(user.getId()) && !isModeratorOrAdmin(user))
            throw new HappyPathException("Non autorizzato", HttpStatus.FORBIDDEN);
        content.setStatus(ContentStatus.DELETED);
        contentRepository.save(content);
    }

    // -------------------------------------------------------------------------
    // Read — tutti usano mapPage() per zero N+1
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Page<ContentResponse> getFeed(Pageable pageable, User currentUser) {
        Page<Content> page = currentUser != null
                ? contentRepository.findFeedExcludingBlocked(currentUser.getId(), pageable)
                : contentRepository.findByStatusOrderByCreatedAtDesc(ContentStatus.ACTIVE, pageable);
        return mapPage(page, currentUser);
    }

    @Transactional(readOnly = true)
    public Page<ContentResponse> getHomeFeed(User user, Pageable pageable) {
        return mapPage(contentRepository.findHomeFeed(user.getId(), pageable), user);
    }

    @Transactional(readOnly = true)
    public Page<ContentResponse> getByTheme(Long themeId, Pageable pageable, User currentUser) {
        Page<Content> page = currentUser != null
                ? contentRepository.findByThemeExcludingBlocked(themeId, currentUser.getId(), pageable)
                : contentRepository.findByThemeIdAndStatusOrderByCreatedAtDesc(
                        themeId, ContentStatus.ACTIVE, pageable);
        return mapPage(page, currentUser);
    }

    @Transactional(readOnly = true)
    public Page<ContentResponse> getByUser(String username, Pageable pageable) {
        User author = userService.findByUsername(username);
        return mapPage(
                contentRepository.findByAuthorAndStatusOrderByCreatedAtDesc(
                        author, ContentStatus.ACTIVE, pageable),
                null);
    }

    @Transactional(readOnly = true)
    public Page<ContentResponse> getByAlterEgo(Long alterEgoId, Pageable pageable) {
        AlterEgo ae = alterEgoService.findById(alterEgoId);
        return mapPage(
                contentRepository.findByAlterEgoAndStatusOrderByCreatedAtDesc(
                        ae, ContentStatus.ACTIVE, pageable),
                null);
    }

    @Transactional(readOnly = true)
    public ContentResponse getOne(Long id, User currentUser) {
        Content content = findById(id);
        if (content.getStatus() == ContentStatus.DELETED)
            throw new HappyPathException("Contenuto non disponibile", HttpStatus.NOT_FOUND);
        return toResponseSingle(content, currentUser);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Mappa una Page<Content> in Page<ContentResponse> con 3+1 query bulk:
     *   1. countReactionsByContentIds   (GROUP BY content_id)
     *   2. countReactionsByTypeForContentIds  (GROUP BY content_id, type)
     *   3. countCommentsByContentIds    (GROUP BY content_id)
     *   4. findByContentIdsAndUser      (myReaction — solo se utente loggato)
     */
    private Page<ContentResponse> mapPage(Page<Content> page, User currentUser) {
        List<Content> contents = page.getContent();
        if (contents.isEmpty()) return page.map(c -> toResponseSingle(c, currentUser));

        List<Long> ids = contents.stream().map(Content::getId).toList();

        Map<Long, Long>              reactionTotals = contentRepository.countReactionsByContentIds(ids);
        Map<Long, Long>              commentTotals  = contentRepository.countCommentsByContentIds(ids);
        Map<Long, Map<String, Long>> byType         = contentRepository.countReactionsByTypeForContentIds(ids);

        // myReaction: una sola query IN per tutti gli id
        Map<Long, String> myReactions = Map.of();
        if (currentUser != null) {
            myReactions = reactionRepository.findByContentIdsAndUser(ids, currentUser)
                    .stream()
                    .collect(Collectors.toMap(
                            r -> r.getContent().getId(),
                            r -> r.getType().name()));
        }

        final Map<Long, String> myReactionsFinal = myReactions;
        List<ContentResponse> mapped = contents.stream()
                .map(c -> toResponse(
                        c,
                        reactionTotals.getOrDefault(c.getId(), 0L),
                        commentTotals.getOrDefault(c.getId(), 0L),
                        byType.getOrDefault(c.getId(), Map.of()),
                        myReactionsFinal.get(c.getId())))
                .toList();

        return new PageImpl<>(mapped, page.getPageable(), page.getTotalElements());
    }

    /** Usato per operazioni su singolo item (create/update/getOne) dove N+1 non è un problema. */
    public ContentResponse toResponseSingle(Content c, User currentUser) {
        List<Long> ids = List.of(c.getId());
        long reactions   = contentRepository.countReactionsByContentIds(ids).getOrDefault(c.getId(), 0L);
        long comments    = contentRepository.countCommentsByContentIds(ids).getOrDefault(c.getId(), 0L);
        Map<String, Long> byType = contentRepository.countReactionsByTypeForContentIds(ids)
                .getOrDefault(c.getId(), Map.of());
        String myReaction = currentUser == null ? null
                : reactionRepository.findByContentIdsAndUser(ids, currentUser).stream()
                        .findFirst().map(r -> r.getType().name()).orElse(null);
        return toResponse(c, reactions, comments, byType, myReaction);
    }

    /** Costruisce il DTO senza toccare nessuna lazy collection. */
    private ContentResponse toResponse(Content c, long reactions, long comments,
                                       Map<String, Long> byType, String myReaction) {
        AlterEgoResponse aeResp = c.getAlterEgo() != null
                ? alterEgoService.toResponse(c.getAlterEgo()) : null;

        ThemeResponse themeResp = c.getTheme() == null ? null
                : new ThemeResponse(
                        c.getTheme().getId(), c.getTheme().getName(),
                        c.getTheme().getDescription(), c.getTheme().getIconEmoji(),
                        c.getTheme().isPreset(), 0L, false, c.getTheme().getCreatedAt());

        return new ContentResponse(
                c.getId(), c.getTitle(), c.getBody(), c.getMediaUrl(),
                userService.toSummary(c.getAuthor()), aeResp, themeResp,
                c.getStatus(), reactions, comments, byType, myReaction,
                List.of(), c.getCreatedAt(), c.getUpdatedAt());
    }

    // -------------------------------------------------------------------------
    // Utility
    // -------------------------------------------------------------------------

    /** Mantenuto per retrocompatibilità con altri service che lo chiamano (es. FeedService). */
    public ContentResponse toResponse(Content c, User currentUser) {
        return toResponseSingle(c, currentUser);
    }

    private boolean isModeratorOrAdmin(User user) {
        return user.getRole() == UserRole.MODERATOR || user.getRole() == UserRole.ADMIN;
    }
}
