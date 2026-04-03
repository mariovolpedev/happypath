package com.happypath.repository;

import com.happypath.model.Ban;
import com.happypath.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BanRepository extends JpaRepository<Ban, Long> {
    List<Ban> findByUser(User user);
    @Query("SELECT b FROM Ban b WHERE b.user = :user AND b.active = true AND (b.expiresAt IS NULL OR b.expiresAt > :now)")
    Optional<Ban> findActiveBanForUser(@Param("user") User user, @Param("now") LocalDateTime now);
}
