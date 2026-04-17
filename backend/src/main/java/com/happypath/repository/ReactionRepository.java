package com.happypath.repository;

import com.happypath.model.Content;
import com.happypath.model.Reaction;
import com.happypath.model.ReactionType;
import com.happypath.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {

    List<Reaction> findByContent(Content content);

    Optional<Reaction> findByContentAndUser(Content content, User user);

    boolean existsByContentAndUser(Content content, User user);

    void deleteByContentAndUser(Content content, User user);

    List<Reaction> findByUserInOrderByCreatedAtDesc(List<User> users);

    /** Reactions dell'utente corrente sui content IDs dati — per myReaction bulk */
    @Query("SELECT r FROM Reaction r WHERE r.content.id IN :ids AND r.user = :user")
    List<Reaction> findByContentIdsAndUser(@Param("ids") List<Long> ids, @Param("user") User user);
}
