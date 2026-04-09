package com.happypath.service;

import com.happypath.model.*;
import com.happypath.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void notifyReaction(User actor, Content content) {
        if (actor.getId().equals(content.getAuthor().getId())) return;
        notificationRepository.save(Notification.builder()
                .recipient(content.getAuthor())
                .actor(actor)
                .type(NotificationType.REACTION)
                .content(content)
                .build());
    }

    @Transactional
    public void notifyComment(User actor, Content content, Comment comment) {
        if (actor.getId().equals(content.getAuthor().getId())) return;
        notificationRepository.save(Notification.builder()
                .recipient(content.getAuthor())
                .actor(actor)
                .type(NotificationType.COMMENT)
                .content(content)
                .comment(comment)
                .build());
    }

    @Transactional
    public void notifyFollow(User actor, User recipient) {
        if (actor.getId().equals(recipient.getId())) return;
        notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(NotificationType.FOLLOW)
                .build());
    }

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

}
