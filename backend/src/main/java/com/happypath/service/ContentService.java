package com.happypath.service;

import com.happypath.dto.request.ContentRequest;
import com.happypath.dto.response.*;
import com.happypath.exception.HappyPathException;
import com.happypath.model.*;
import com.happypath.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository contentRepository;
    private final ThemeRepository themeRepository;
    private final AlterEgoRepository alterEgoRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    public Content findById(Long id) {
        return contentRepository.findById(id)
                .orElseThrow(() -> new HappyPathException("Contenuto non trovato", HttpStatus.NOT_FOUND));
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
                    .orElseThrow(() -> new HappyPathException("Tema non trovato", HttpStatus.NOT_FOUND)));

        if (req.alterEgoId() != null) {
            if (!author.isVerified())
                throw new HappyPathException("Solo gli utenti verificati possono usare un Alter Ego", HttpStatus.FORBIDDEN);
            AlterEgo ae = alterEgoRepository.findById(req.alterEgoId())
                    .orElseThrow(() -> new HappyPathException("Alter Ego non trovato", HttpStatus.NOT_FOUND));
            if (!ae.getOwner().getId().equals(author.getId()))
                throw new HappyPathException("Non sei il proprietario di questo Alter Ego", HttpStatus.FORBIDDEN);
            builder.alterEgo(ae);
        }

        Content content = contentRepository.save(builder.build());
        return toResponse(content, author);
    }

    @Transactional
    public ContentResponse update(Long id, ContentRequest req, User user) {
        Content content = findById(id);
        if (!content.getAuthor().getId().equals(user.getId()) && !isModeratorOrAdmin(user))
            throw new HappyPathException("Non autorizzato", HttpStatus.FORBIDDEN);

        if (req.title() != null) content.setTitle(req.title());
        if (req.body() != null) content.setBody(req.body());
        if (req.mediaUrl() != null) content.setMediaUrl(req.mediaUrl());
        if (req.themeId() != null)
            content.setTheme(themeRepository.findById(req.themeId()).orElse(null));

        content = contentRepository.save(content);
        return toResponse(content, user);
    }

    @Transactional
    public void delete(Long id, User user) {
        Content content = findById(id);
        if (!content.getAuthor().getId().equals(user.getId()) && !isModeratorOrAdmin(user))
            throw new HappyPathException("Non autorizzato", HttpStatus.FORBIDDEN);
        content.setStatus(ContentStatus.DELETED);
        contentRepository.save(content);
    }

    /**
     * Feed pubblico. Se l'utente è autenticato, esclude i contenuti di utenti bloccati
     * (in qualsiasi direzione).
     */
    public Page<ContentResponse> getFeed(Pageable pageable, User currentUser) {
        if (currentUser != null) {
            return contentRepository.findFeedExcludingBlocked(currentUser.getId(), pageable)
                    .map(c -> toResponse(c, currentUser));
        }
        return contentRepository.findByStatusOrderByCreatedAtDesc(ContentStatus.ACTIVE, pageable)
                .map(c -> toResponse(c, null));
    }

    public Page<ContentResponse> getHomeFeed(User user, Pageable pageable) {
        return contentRepository.findHomeFeed(user.getId(), pageable)
                .map(c -> toResponse(c, user));
    }

    /**
     * Feed per tema. Se autenticato, esclude i blocchi bidirezionali.
     */
    public Page<ContentResponse> getByTheme(Long themeId, Pageable pageable, User currentUser) {
        if (currentUser != null) {
            return contentRepository.findByThemeExcludingBlocked(themeId, currentUser.getId(), pageable)
                    .map(c -> toResponse(c, currentUser));
        }
        return contentRepository.findByThemeIdAndStatusOrderByCreatedAtDesc(themeId, ContentStatus.ACTIVE, pageable)
                .map(c -> toResponse(c, null));
    }

    public Page<ContentResponse> getByUser(String username, Pageable pageable) {
        User author = userService.findByUsername(username);
        return contentRepository.findByAuthorAndStatusOrderByCreatedAtDesc(author, ContentStatus.ACTIVE, pageable)
                .map(c -> toResponse(c, null));
    }

    public ContentResponse getOne(Long id, User currentUser) {
        Content content = findById(id);
        if (content.getStatus() == ContentStatus.DELETED)
            throw new HappyPathException("Contenuto non disponibile", HttpStatus.NOT_FOUND);
        return toResponse(content, currentUser);
    }

    private boolean isModeratorOrAdmin(User user) {
        return user.getRole() == UserRole.MODERATOR || user.getRole() == UserRole.ADMIN;
    }

    public ContentResponse toResponse(Content c, User currentUser) {
        List<Reaction> reactions = reactionRepository.findByContent(c);
        Map<String, Long> byType = reactions.stream()
                .collect(Collectors.groupingBy(r -> r.getType().name(), Collectors.counting()));
        String myReaction = currentUser == null ? null : reactions.stream()
                .filter(r -> r.getUser().getId().equals(currentUser.getId()))
                .findFirst().map(r -> r.getType().name()).orElse(null);
        long commentsCount = commentRepository.countByContentAndStatus(c, ContentStatus.ACTIVE);

        AlterEgoResponse aeResp = c.getAlterEgo() == null ? null :
                new AlterEgoResponse(c.getAlterEgo().getId(), c.getAlterEgo().getName(),
                        c.getAlterEgo().getDescription(), c.getAlterEgo().getAvatarUrl(),
                        userService.toSummary(c.getAlterEgo().getOwner()));
        ThemeResponse themeResp = c.getTheme() == null ? null :
                new ThemeResponse(c.getTheme().getId(), c.getTheme().getName(),
                        c.getTheme().getDescription(), c.getTheme().getIconEmoji());

        return new ContentResponse(
                c.getId(), c.getTitle(), c.getBody(), c.getMediaUrl(),
                userService.toSummary(c.getAuthor()), aeResp, themeResp, c.getStatus(),
                reactions.size(), commentsCount, byType, myReaction,
                List.of(), c.getCreatedAt(), c.getUpdatedAt());
    }
}
