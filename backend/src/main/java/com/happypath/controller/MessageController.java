package com.happypath.controller;

import com.happypath.dto.request.MessageRequest;
import com.happypath.dto.response.ConversationSummary;
import com.happypath.dto.response.MessageResponse;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    /**
     * Send a new direct message.
     * Both sender and recipient must be verified and mutually following each other.
     */
    @PostMapping
    public ResponseEntity<MessageResponse> send(
            @Valid @RequestBody MessageRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(messageService.send(req, details.getUser()));
    }

    /**
     * Get paginated conversation history with a specific user.
     */
    @GetMapping("/conversation/{otherId}")
    public ResponseEntity<Page<MessageResponse>> getConversation(
            @PathVariable Long otherId,
            @AuthenticationPrincipal HappyPathUserDetails details,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(
                messageService.getConversation(details.getUser().getId(), otherId, pageable));
    }

    /**
     * Get the inbox: one summary entry per conversation, sorted by most recent message.
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationSummary>> getConversations(
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(messageService.getConversations(details.getUser()));
    }

    /**
     * Mark all messages from a specific sender as read.
     */
    @PostMapping("/conversation/{otherId}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long otherId,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        messageService.markConversationAsRead(details.getUser().getId(), otherId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Total unread message count for the current user — used for the navbar badge.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(
            @AuthenticationPrincipal HappyPathUserDetails details) {
        long count = messageService.countUnread(details.getUser().getId());
        return ResponseEntity.ok(Map.of("count", count));
    }
}
