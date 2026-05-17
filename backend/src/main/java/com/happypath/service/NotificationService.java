package com.happypath.service;

import com.happypath.dto.response.NotificationResponse;
import com.happypath.model.*;
import com.happypath.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private static final String NOTIFICATION_DESTINATION = "/queue/notifications";

    private final NotificationRepository  notificationRepository;
    /**
     * SimpMessagingTemplate sends a message to a specific connected user
     * via STOMP WebSocket (destination: /user/{username}/queue/notifications).
     * If the user is not connected, the message is silently dropped — it was
     * already persisted and will be fetched on next poll/reconnect.
     */
    private final SimpMessagingTemplate messagingTemplate;

    // ---------------------------------------------------------------
    // Outgoing notifications
    // ---------------------------------------------------------------

    @Transactional
    public void notifyReaction(User actor, Content content) {
        if (actor.getId().equals(content.getAuthor().getId())) return;
        Notification n = notificationRepository.save(Notification.builder()
                .recipient(content.getAuthor())
                .actor(actor)
                .type(NotificationType.REACTION)
                .content(content)
                .build());
        pushAfterCommit(n);
    }

    @Transactional
    public void notifyComment(User actor, Content content, Comment comment) {
        if (actor.getId().equals(content.getAuthor().getId())) return;
        Notification n = notificationRepository.save(Notification.builder()
                .recipient(content.getAuthor())
                .actor(actor)
                .type(NotificationType.COMMENT)
                .content(content)
                .comment(comment)
                .build());
        pushAfterCommit(n);
    }

    @Transactional
    public void notifyFollow(User actor, User recipient) {
        if (actor.getId().equals(recipient.getId())) return;
        Notification n = notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(NotificationType.FOLLOW)
                .build());
        pushAfterCommit(n);
    }

    /** Notifica all'autore del commento quando riceve una reazione. */
    @Transactional
    public void notifyCommentReaction(User actor, Comment comment) {
        if (actor.getId().equals(comment.getAuthor().getId())) return;
        Notification n = notificationRepository.save(Notification.builder()
                .recipient(comment.getAuthor())
                .actor(actor)
                .type(NotificationType.COMMENT_REACTION)
                .content(comment.getContent())
                .comment(comment)
                .build());
        pushAfterCommit(n);
    }

    // ---------------------------------------------------------------
    // Reading notifications
    // ---------------------------------------------------------------

    public Page<Notification> getNotifications(User recipient, Pageable pageable) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(recipient, pageable);
    }

    public long countUnread(User recipient) {
        return notificationRepository.countByRecipientAndReadFalse(recipient);
    }

    @Transactional
    public void markAllRead(User recipient) {
        notificationRepository.markAllReadByRecipient(recipient);
    }

    @Transactional
    public void markRead(Long notificationId, User recipient) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getRecipient().getId().equals(recipient.getId())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    // ---------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------

    /**
     * Schedules the WebSocket push to happen AFTER the current transaction
     * commits successfully.
     *
     * Why after commit?
     * If we push via WebSocket inside the transaction and then the TX rolls back,
     * the client would receive a notification for a notification that doesn't
     * exist in the database.
     */
    private void pushAfterCommit(Notification notification) {
        if (!TransactionSynchronizationManager.isActualTransactionActive()) {
            pushToUser(notification);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        pushToUser(notification);
                    }
                });
    }

    private void pushToUser(Notification notification) {
        String username = notification.getRecipient().getUsername();
        try {
            NotificationResponse payload = NotificationResponse.from(notification);
            messagingTemplate.convertAndSendToUser(username, NOTIFICATION_DESTINATION, payload);
            log.debug("Pushed notification {} to user {}", notification.getId(), username);
        } catch (Exception ex) {
            // Non-critical: the notification is already persisted.
            // If the user is offline the push simply has no connected session.
            log.warn("Could not push notification to user {}: {}", username, ex.getMessage());
        }
    }
}
