package dev.mariovolpe.happypath.content;

import dev.mariovolpe.happypath.alterego.AlterEgo;
import dev.mariovolpe.happypath.alterego.AlterEgoRepository;
import dev.mariovolpe.happypath.content.dto.*;
import dev.mariovolpe.happypath.user.User;
import dev.mariovolpe.happypath.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository  contentRepository;
    private final AlterEgoRepository alterEgoRepository;
    private final UserRepository     userRepository;

    // ── feed / lettura ────────────────────────────────────────────────────────

    public Page<ContentResponse> getFeed(int page, Long themeId, Long requesterId) {
        Pageable pageable = PageRequest.of(page, 20, Sort.by("createdAt").descending());
        List<Content> contents = themeId != null
            ? contentRepository.findByThemeIdAndStatus(themeId, ContentStatus.ACTIVE, pageable)
            : contentRepository.findByStatus(ContentStatus.ACTIVE, pageable);
        return new PageImpl<>(contents.stream()
            .map(c -> toResponse(c, requesterId)).toList(),
            pageable, contents.size());
    }

    public Page<ContentResponse> getHomeFeed(int page, Long requesterId) {
        Pageable pageable = PageRequest.of(page, 20, Sort.by("createdAt").descending());
        List<Content> contents = contentRepository.findHomeFeed(requesterId, pageable);
        return new PageImpl<>(contents.stream()
            .map(c -> toResponse(c, requesterId)).toList(),
            pageable, contents.size());
    }

    public ContentResponse getById(Long id, Long requesterId) {
        Content content = contentRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contenuto non trovato"));
        return toResponse(content, requesterId);
    }

    // ── scrittura ─────────────────────────────────────────────────────────────

    @Transactional
    public ContentResponse create(ContentRequest req, Long authorId) {
        User author = userRepository.findById(authorId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utente non trovato"));

        AlterEgo alterEgo = null;
        if (req.alterEgoId() != null) {
            alterEgo = alterEgoRepository.findById(req.alterEgoId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alter ego non trovato"));
            if (!alterEgo.getOwner().getId().equals(authorId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "L'alter ego non appartiene a te");
            }
        }

        Content content = Content.builder()
            .title(req.title())
            .body(req.body())
            .mediaUrl(req.mediaUrl())
            .author(author)
            .alterEgo(alterEgo)
            .status(ContentStatus.ACTIVE)
            .build();

        return toResponse(contentRepository.save(content), authorId);
    }

    @Transactional
    public ContentResponse update(Long id, ContentRequest req, Long requesterId) {
        Content content = contentRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contenuto non trovato"));
        if (!content.getAuthor().getId().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non sei l'autore");
        }
        content.setTitle(req.title());
        content.setBody(req.body());
        content.setMediaUrl(req.mediaUrl());
        return toResponse(contentRepository.save(content), requesterId);
    }

    /**
     * Cambia il profilo con cui è pubblicato il contenuto.
     * @param contentId   id del contenuto da modificare
     * @param requesterId id dell'utente che fa la richiesta (deve essere l'autore)
     * @param alterEgoId  id alter ego da usare, oppure null per tornare al profilo reale
     */
    @Transactional
    public ContentResponse changePublisher(Long contentId, Long requesterId, Long alterEgoId) {
        Content content = contentRepository.findById(contentId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contenuto non trovato"));

        if (!content.getAuthor().getId().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Solo l'autore può cambiare il profilo di pubblicazione");
        }

        if (alterEgoId != null) {
            AlterEgo ae = alterEgoRepository.findById(alterEgoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alter ego non trovato"));
            if (!ae.getOwner().getId().equals(requesterId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "L'alter ego non appartiene a te");
            }
            content.setAlterEgo(ae);
        } else {
            content.setAlterEgo(null);
        }

        return toResponse(contentRepository.save(content), requesterId);
    }

    @Transactional
    public void delete(Long id, Long requesterId, String requesterRole) {
        Content content = contentRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contenuto non trovato"));
        boolean isAuthor = content.getAuthor().getId().equals(requesterId);
        boolean isMod    = requesterRole.equals("MODERATOR") || requesterRole.equals("ADMIN");
        if (!isAuthor && !isMod) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non autorizzato");
        }
        content.setStatus(ContentStatus.DELETED);
        contentRepository.save(content);
    }

    // ── helper ────────────────────────────────────────────────────────────────

    protected ContentResponse toResponse(Content content, Long requesterId) {
        return ContentResponse.from(content, requesterId);
    }
}
