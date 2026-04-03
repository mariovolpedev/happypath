package com.happypath.controller;

import com.happypath.dto.request.CommentRequest;
import com.happypath.dto.response.CommentResponse;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.CommentService;
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
@RequestMapping("/contents/{contentId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<Page<CommentResponse>> getComments(
            @PathVariable Long contentId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(commentService.getComments(contentId, pageable));
    }

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long contentId,
            @Valid @RequestBody CommentRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.status(HttpStatus.CREATED).body(commentService.addComment(contentId, req, details.getUser()));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long contentId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        commentService.deleteComment(commentId, details.getUser());
        return ResponseEntity.noContent().build();
    }
}
