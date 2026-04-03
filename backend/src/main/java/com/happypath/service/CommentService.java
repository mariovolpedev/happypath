package com.happypath.service;

import com.happypath.dto.request.CommentRequest;
import com.happypath.dto.response.CommentResponse;
import com.happypath.exception.HappyPathException;
import com.happypath.model.*;
import com.happypath.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final ContentService contentService;
    private final UserService userService;

    @Transactional
    public CommentResponse addComment(Long contentId, CommentRequest req, User author) {
        Content content = contentService.findById(contentId);
        if (content.getStatus() != ContentStatus.ACTIVE)
            throw new HappyPathException("Contenuto non disponibile", HttpStatus.BAD_REQUEST);

        Comment.CommentBuilder builder = Comment.builder()
                .content(content)
                .author(author)
                .text(req.text());

        if (req.parentId() != null) {
            Comment parent = commentRepository.findById(req.parentId())
                    .orElseThrow(() -> new HappyPathException("Commento padre non trovato", HttpStatus.NOT_FOUND));
            builder.parent(parent);
        }

        return toResponse(commentRepository.save(builder.build()));
    }

    public Page<CommentResponse> getComments(Long contentId, Pageable pageable) {
        Content content = contentService.findById(contentId);
        return commentRepository.findByContentAndParentIsNullAndStatusOrderByCreatedAtAsc(
                content, ContentStatus.ACTIVE, pageable).map(this::toResponse);
    }

    @Transactional
    public void deleteComment(Long id, User user) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new HappyPathException("Commento non trovato", HttpStatus.NOT_FOUND));
        if (!comment.getAuthor().getId().equals(user.getId()) &&
                user.getRole() != UserRole.MODERATOR && user.getRole() != UserRole.ADMIN)
            throw new HappyPathException("Non autorizzato", HttpStatus.FORBIDDEN);
        comment.setStatus(ContentStatus.DELETED);
        commentRepository.save(comment);
    }

    private CommentResponse toResponse(Comment c) {
        return new CommentResponse(c.getId(), c.getText(), userService.toSummary(c.getAuthor()),
                c.getParent() != null ? c.getParent().getId() : null, c.getStatus(), c.getCreatedAt());
    }
}
