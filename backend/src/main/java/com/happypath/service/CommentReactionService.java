package com.happypath.service;

import com.happypath.dto.response.CommentReactionResponse;
import com.happypath.dto.response.CommentReactionSummaryResponse;
import com.happypath.exception.HappyPathException;
import com.happypath.model.*;
import com.happypath.repository.CommentReactionRepository;
import com.happypath.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentReactionService {

    private final CommentReactionRepository commentReactionRepository;
    private final CommentRepository         commentRepository;
    private final AlterEgoService           alterEgoService;
    private final UserService               userService;
    private final NotificationService       notificationService;

    // ---------------------------------------------------------------
    // Aggiungi / sostituisci reazione
    // ---------------------------------------------------------------
    @Transactional
    public CommentReactionSummaryResponse react(
            Long commentId, ReactionType type, User user, Long alterEgoId) {

        Comment comment = findActiveComment(commentId);
        AlterEgo alterEgo = alterEgoService.resolveForUser(alterEgoId, user);

        boolean isNew = !commentReactionRepository.existsByCommentAndUser(comment, user);

        // Rimuovi eventuale reazione esistente
        commentReactionRepository.findByUserAndComment(user, comment)
                .ifPresent(existing -> {
                    commentReactionRepository.delete(existing);
                    commentReactionRepository.flush();
                });

        commentReactionRepository.save(CommentReaction.builder()
                .user(user)
                .alterEgo(alterEgo)
                .comment(comment)
                .type(type)
                .build());

        if (isNew) notificationService.notifyCommentReaction(user, comment);

        return buildSummary(comment, user);
    }

    // ---------------------------------------------------------------
    // Rimuovi reazione
    // ---------------------------------------------------------------
    @Transactional
    public CommentReactionSummaryResponse removeReaction(Long commentId, User user) {
        Comment comment = findActiveComment(commentId);
        commentReactionRepository.findByUserAndComment(user, comment)
                .ifPresent(commentReactionRepository::delete);
        return buildSummary(comment, user);
    }

    // ---------------------------------------------------------------
    // Lista dettagliata delle reazioni
    // ---------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<CommentReactionResponse> getReactions(Long commentId) {
        Comment comment = findActiveComment(commentId);
        return commentReactionRepository.findByComment(comment).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ---------------------------------------------------------------
    // Riepilogo (usato anche da CommentService)
    // ---------------------------------------------------------------
    @Transactional(readOnly = true)
    public CommentReactionSummaryResponse buildSummary(Comment comment, User currentUser) {
        List<Object[]> rows = commentReactionRepository.countByTypeForComment(comment);
        Map<ReactionType, Long> counts = rows.stream()
                .collect(Collectors.toMap(
                        r -> (ReactionType) r[0],
                        r -> (Long) r[1]));
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        ReactionType myReaction = currentUser != null
                ? commentReactionRepository.findTypeByCommentIdAndUser(comment.getId(), currentUser).orElse(null)
                : null;
        return new CommentReactionSummaryResponse(total, counts, myReaction);
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------
    private Comment findActiveComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new HappyPathException("Commento non trovato", HttpStatus.NOT_FOUND));
        if (comment.getStatus() != ContentStatus.ACTIVE)
            throw new HappyPathException("Commento non disponibile", HttpStatus.BAD_REQUEST);
        return comment;
    }

    private CommentReactionResponse toResponse(CommentReaction r) {
        return new CommentReactionResponse(
                r.getId(),
                r.getType(),
                userService.toSummary(r.getUser()),
                r.getAlterEgo() != null ? alterEgoService.toResponse(r.getAlterEgo()) : null,
                r.getCreatedAt());
    }
}
