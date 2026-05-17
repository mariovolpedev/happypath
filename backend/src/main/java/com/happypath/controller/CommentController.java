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

    /** Lista commenti radice di un post (paginata). */
    @GetMapping
    public ResponseEntity<Page<CommentResponse>> getComments(
            @PathVariable Long contentId,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(
                commentService.getComments(contentId, pageable,
                        details != null ? details.getUser() : null));
    }

    /** Lista delle risposte (replies) a un commento specifico. */
    @GetMapping("/{commentId}/replies")
    public ResponseEntity<Page<CommentResponse>> getReplies(
            @PathVariable Long contentId,
            @PathVariable Long commentId,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(
                commentService.getReplies(contentId, commentId, pageable,
                        details != null ? details.getUser() : null));
    }

    /** Aggiunge un commento o una risposta a un post.
     *  Per rispondere a un commento, includere {@code parentId} nel body. */
    @PostMapping
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long contentId,
            @Valid @RequestBody CommentRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.addComment(contentId, req, details.getUser()));
    }

    /** Elimina (soft-delete) un commento. */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long contentId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        commentService.deleteComment(commentId, details.getUser());
        return ResponseEntity.noContent().build();
    }
}
