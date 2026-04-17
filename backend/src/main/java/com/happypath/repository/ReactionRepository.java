package com.happypath.repository;

import com.happypath.model.Content;
import com.happypath.model.Reaction;
import com.happypath.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    // --- metodi pre-esistenti ---
    Optional<Reaction> findByUserAndContent(User user, Content content);
    boolean existsByUserAndContent(User user, Content content);
    long countByContent(Content content);
    List<Reaction> findByContent(Content content);
    Page<Reaction> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    // --- nuovo metodo per il feed ---
    List<Reaction> findByUserInOrderByCreatedAtDesc(List<User> users);
}
