package com.happypath.repository;

import com.happypath.model.Content;
import com.happypath.model.Reaction;
import com.happypath.model.ReactionType;
import com.happypath.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    Optional<Reaction> findByUserAndContent(User user, Content content);
    boolean existsByUserAndContent(User user, Content content);
    long countByContent(Content content);
    List<Reaction> findByContent(Content content);
}
