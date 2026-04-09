package com.happypath.controller;

import com.happypath.dto.response.NotificationResponse;
import com.happypath.model.Notification;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.NotificationService;
import com.happypath.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal HappyPathUserDetails details,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(
                notificationService.getNotifications(details.getUser(), pageable).map(this::toResponse)
        );
    }

    private NotificationResponse toResponse(Notification n) {
        String contentTitle = n.getContent() != null ? n.getContent().getTitle() : null;
        Long contentId = n.getContent() != null ? n.getContent().getId() : null;
        Long commentId = n.getComment() != null ? n.getComment().getId() : null;
        String commentPreview = null;
        if (n.getComment() != null) {
            String text = n.getComment().getText();
            commentPreview = text.length() > 80 ? text.substring(0, 80) + "…" : text;
        }
        return new NotificationResponse(
                n.getId(),
                userService.toSummary(n.getActor()),
                n.getType(),
                contentId,
                contentTitle,
                commentId,
                commentPreview,
                n.isRead(),
                n.getCreatedAt()
        );
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal HappyPathUserDetails details) {
        long count = notificationService.countUnread(details.getUser());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllRead(
            @AuthenticationPrincipal HappyPathUserDetails details) {
        notificationService.markAllRead(details.getUser());
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markRead(
            @PathVariable Long id,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        notificationService.markRead(id, details.getUser());
        return ResponseEntity.ok().build();
    }
}
