package com.happypath.repository;

import com.happypath.model.Comment;
import com.happypath.model.Content;
import com.happypath.model.ContentStatus;
import com.happypath.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    // Commenti radice di un content (nessun parent)
    Page<Comment> findByContentAndParentIsNullAndStatusOrderByCreatedAtAsc(
            Content content, ContentStatus status, Pageable pageable);

    // Risposte dirette a un commento
    Page<Comment> findByParentAndStatusOrderByCreatedAtAsc(
            Comment parent, ContentStatus status, Pageable pageable);

    // Conteggio commenti radice per un content
    long countByContentAndStatus(Content content, ContentStatus status);

    // Conteggio risposte per un commento
    long countByParentAndStatus(Comment parent, ContentStatus status);

    // Attività commenti di un utente
    Page<Comment> findByAuthorAndStatusOrderByCreatedAtDesc(
            User author, ContentStatus status, Pageable pageable);

    // Feed: commenti recenti di una lista di autori
    List<Comment> findByAuthorInAndStatusOrderByCreatedAtDesc(
            List<User> authors, ContentStatus status);
}
