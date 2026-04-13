package com.happypath.controller;

import com.happypath.dto.request.ContentRequest;
import com.happypath.dto.response.ContentResponse;
import com.happypath.model.ReactionType;
import com.happypath.model.User;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.CommentService;
import com.happypath.service.ContentService;
import com.happypath.service.ReactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/contents")
@RequiredArgsConstructor
public class ContentController {

    private final ContentService  contentService;
    private final ReactionService reactionService;
    private final CommentService  commentService;

    @GetMapping
    public ResponseEntity<Page<ContentResponse>> getFeed(
            @RequestParam(required = false) Long themeId,
            @AuthenticationPrincipal HappyPathUserDetails details,
            @PageableDefault(size = 20, sort = "createdAt",
                             direction = Sort.Direction.DESC) Pageable pageable) {
        User currentUser = details != null ? details.getUser() : null;
        if (themeId != null)
            return ResponseEntity.ok(contentService.getByTheme(themeId, pageable, currentUser));
        return ResponseEntity.ok(contentService.getFeed(pageable, currentUser));
    }

    @GetMapping("/home")
    public ResponseEntity<Page<ContentResponse>> getHomeFeed(
            @AuthenticationPrincipal HappyPathUserDetails details,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(contentService.getHomeFeed(details.getUser(), pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContentResponse> getOne(
            @PathVariable Long id,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(
                contentService.getOne(id, details != null ? details.getUser() : null));
    }

    @PostMapping
    public ResponseEntity<ContentResponse> create(
            @Valid @RequestBody ContentRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contentService.create(req, details.getUser()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContentResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ContentRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(contentService.update(id, req, details.getUser()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        contentService.delete(id, details.getUser());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reactions")
    public ResponseEntity<Void> react(
            @PathVariable Long id,
            @RequestParam ReactionType type,
            @RequestParam(required = false) Long alterEgoId,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        reactionService.react(id, type, details.getUser(), alterEgoId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/reactions")
    public ResponseEntity<Void> removeReaction(
            @PathVariable Long id,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        reactionService.removeReaction(id, details.getUser());
        return ResponseEntity.noContent().build();
    }
}
