package com.happypath.repository;

import com.happypath.model.Comment;
import com.happypath.model.Content;
import com.happypath.model.ContentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    Page<Comment> findByContentAndParentIsNullAndStatusOrderByCreatedAtAsc(Content content, ContentStatus status, Pageable pageable);
    Page<Comment> findByParentAndStatusOrderByCreatedAtAsc(Comment parent, ContentStatus status, Pageable pageable);
    long countByContentAndStatus(Content content, ContentStatus status);
}
