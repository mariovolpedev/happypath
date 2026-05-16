package com.happypath.service;

import com.happypath.dto.request.BanRequest;
import com.happypath.dto.response.ModerationAction;
import com.happypath.exception.HappyPathException;
import com.happypath.model.*;
import com.happypath.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ModerationService {

    private final UserRepository        userRepository;
    private final ContentRepository     contentRepository;
    private final CommentRepository     commentRepository;
    private final ModerationActionRepository moderationActionRepository;

    // ---- Ban / Unban -------------------------------------------------------

    @Transactional
    public void banUser(User moderator, Long targetId, BanRequest req) {
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new HappyPathException("Utente non trovato", HttpStatus.NOT_FOUND));

        if (!target.isActive())
            throw new HappyPathException("L'utente è già bannato", HttpStatus.CONFLICT);

        LocalDateTime expiresAt = switch (req.duration()) {
            case SHORT    -> LocalDateTime.now().plusDays(1);
            case MEDIUM   -> LocalDateTime.now().plusDays(7);
            case LONG     -> LocalDateTime.now().plusDays(30);
            case PERMANENT -> null;
        };

        target.setActive(false);
        userRepository.save(target);

        ModerationAction action = ModerationAction.builder()
                .moderator(moderator)
                .targetUser(target)
                .actionType(ModerationActionType.BAN)
                .reason(req.reason())
                .expiresAt(expiresAt)
                .build();
        moderationActionRepository.save(action);
    }

    @Transactional
    public void unbanUser(User moderator, Long targetId) {
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new HappyPathException("Utente non trovato", HttpStatus.NOT_FOUND));

        if (target.isActive())
            throw new HappyPathException("L'utente non è bannato", HttpStatus.CONFLICT);

        target.setActive(true);
        userRepository.save(target);

        ModerationAction action = ModerationAction.builder()
                .moderator(moderator)
                .targetUser(target)
                .actionType(ModerationActionType.UNBAN)
                .reason("Unban")
                .build();
        moderationActionRepository.save(action);
    }

    // ---- Content moderation -----------------------------------------------

    @Transactional
    public void censorContent(User moderator, Long contentId, String reason) {
        com.happypath.model.Content content = contentRepository.findById(contentId)
                .orElseThrow(() -> new HappyPathException("Contenuto non trovato", HttpStatus.NOT_FOUND));
        content.setStatus(ContentStatus.CENSORED);
        contentRepository.save(content);

        ModerationAction action = ModerationAction.builder()
                .moderator(moderator)
                .targetContent(content)
                .actionType(ModerationActionType.CENSOR_CONTENT)
                .reason(reason)
                .build();
        moderationActionRepository.save(action);
    }

    @Transactional
    public void restoreContent(User moderator, Long contentId) {
        com.happypath.model.Content content = contentRepository.findById(contentId)
                .orElseThrow(() -> new HappyPathException("Contenuto non trovato", HttpStatus.NOT_FOUND));
        content.setStatus(ContentStatus.ACTIVE);
        contentRepository.save(content);

        ModerationAction action = ModerationAction.builder()
                .moderator(moderator)
                .targetContent(content)
                .actionType(ModerationActionType.RESTORE_CONTENT)
                .reason("Ripristino contenuto")
                .build();
        moderationActionRepository.save(action);
    }

    // ---- Comment moderation -----------------------------------------------

    @Transactional
    public void censorComment(User moderator, Long commentId, String reason) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new HappyPathException("Commento non trovato", HttpStatus.NOT_FOUND));
        comment.setStatus(ContentStatus.CENSORED);
        commentRepository.save(comment);

        ModerationAction action = ModerationAction.builder()
                .moderator(moderator)
                .targetComment(comment)
                .actionType(ModerationActionType.CENSOR_COMMENT)
                .reason(reason)
                .build();
        moderationActionRepository.save(action);
    }

    // ---- History -----------------------------------------------------------

    public List<ModerationAction> getHistory(int limit) {
        return moderationActionRepository.findTopNByOrderByCreatedAtDesc(limit);
    }
}
