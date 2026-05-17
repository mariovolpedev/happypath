package com.happypath.service;

import com.happypath.model.*;
import com.happypath.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /** Notifica al proprietario del content quando riceve un commento. */
    @Transactional
    public void notifyComment(User actor, Content content, Comment comment) {
        if (actor.getId().equals(content.getAuthor().getId())) return;
        notificationRepository.save(Notification.builder()
                .recipient(content.getAuthor())
                .actor(actor)
                .type(NotificationType.COMMENT)
                .targetContentId(content.getId())
                .targetCommentId(comment.getId())
                .build());
    }

    /** Notifica all'autore del commento quando riceve una reazione. */
    @Transactional
    public void notifyCommentReaction(User actor, Comment comment) {
        if (actor.getId().equals(comment.getAuthor().getId())) return;
        notificationRepository.save(Notification.builder()
                .recipient(comment.getAuthor())
                .actor(actor)
                .type(NotificationType.COMMENT_REACTION)
                .targetContentId(comment.getContent().getId())
                .targetCommentId(comment.getId())
                .build());
    }

    /** Notifica al proprietario del content quando riceve una reazione. */
    @Transactional
    public void notifyReaction(User actor, Content content) {
        if (actor.getId().equals(content.getAuthor().getId())) return;
        notificationRepository.save(Notification.builder()
                .recipient(content.getAuthor())
                .actor(actor)
                .type(NotificationType.REACTION)
                .targetContentId(content.getId())
                .build());
    }
}
