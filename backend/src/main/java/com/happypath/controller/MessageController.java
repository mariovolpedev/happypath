package com.happypath.controller;

import com.happypath.dto.request.MessageRequest;
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

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public ResponseEntity<MessageResponse> send(
            @Valid @RequestBody MessageRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.status(HttpStatus.CREATED).body(messageService.send(req, details.getUser()));
    }

    @GetMapping("/conversation/{otherId}")
    public ResponseEntity<Page<MessageResponse>> getConversation(
            @PathVariable Long otherId,
            @AuthenticationPrincipal HappyPathUserDetails details,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(messageService.getConversation(details.getUser().getId(), otherId, pageable));
    }
}
