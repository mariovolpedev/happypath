package com.happypath.controller;

import com.happypath.dto.response.UserCommentActivityResponse;
import com.happypath.dto.response.UserReactionResponse;
import com.happypath.model.Comment;
import com.happypath.model.ContentStatus;
import com.happypath.model.Reaction;
import com.happypath.model.User;
import com.happypath.repository.CommentRepository;
import com.happypath.repository.ReactionRepository;
import com.happypath.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserActivityController {

    private final UserService userService;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;

    @GetMapping("/{username}/reactions")
    public ResponseEntity<Page<UserReactionResponse>> getUserReactions(
            @PathVariable String username,
            @PageableDefault(size = 20) Pageable pageable) {
        User user = userService.findByUsername(username);
        Page<UserReactionResponse> page = reactionRepository
                .findByUserOrderByCreatedAtDesc(user, pageable)
                .map(this::toReactionResponse);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{username}/comments-activity")
    public ResponseEntity<Page<UserCommentActivityResponse>> getUserComments(
            @PathVariable String username,
            @PageableDefault(size = 20) Pageable pageable) {
        User user = userService.findByUsername(username);
        Page<UserCommentActivityResponse> page = commentRepository
                .findByAuthorAndStatusOrderByCreatedAtDesc(user, ContentStatus.ACTIVE, pageable)
                .map(this::toCommentResponse);
        return ResponseEntity.ok(page);
    }

    private UserReactionResponse toReactionResponse(Reaction r) {
        var content = r.getContent();
        return new UserReactionResponse(
                r.getId(),
                new UserReactionResponse.ContentSummary(content.getId(), content.getTitle(), content.getMediaUrl()),
                r.getType().name(),
                r.getCreatedAt()
        );
    }

    private UserCommentActivityResponse toCommentResponse(Comment c) {
        var content = c.getContent();
        return new UserCommentActivityResponse(
                c.getId(),
                c.getText(),
                new UserCommentActivityResponse.ContentSummary(content.getId(), content.getTitle()),
                c.getStatus(),
                c.getCreatedAt()
        );
    }
}
