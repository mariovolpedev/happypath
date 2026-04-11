package com.happypath.repository;

import com.happypath.model.Content;
import com.happypath.model.ContentStatus;
import com.happypath.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContentRepository extends JpaRepository<Content, Long> {

    Page<Content> findByStatusOrderByCreatedAtDesc(ContentStatus status, Pageable pageable);
    Page<Content> findByAuthorAndStatusOrderByCreatedAtDesc(User author, ContentStatus status, Pageable pageable);
    Page<Content> findByThemeIdAndStatusOrderByCreatedAtDesc(Long themeId, ContentStatus status, Pageable pageable);

    /** Feed globale escludendo blocchi bidirezionali */
    @Query("SELECT c FROM Content c WHERE c.status = 'ACTIVE' " +
           "AND NOT EXISTS (SELECT b FROM Block b WHERE " +
           "   (b.blocker.id = :userId AND b.blocked.id = c.author.id) OR " +
           "   (b.blocked.id = :userId AND b.blocker.id = c.author.id)) " +
           "ORDER BY c.createdAt DESC")
    Page<Content> findFeedExcludingBlocked(@Param("userId") Long userId, Pageable pageable);

    /** Feed per tema escludendo blocchi bidirezionali */
    @Query("SELECT c FROM Content c WHERE c.theme.id = :themeId AND c.status = 'ACTIVE' " +
           "AND NOT EXISTS (SELECT b FROM Block b WHERE " +
           "   (b.blocker.id = :userId AND b.blocked.id = c.author.id) OR " +
           "   (b.blocked.id = :userId AND b.blocker.id = c.author.id)) " +
           "ORDER BY c.createdAt DESC")
    Page<Content> findByThemeExcludingBlocked(@Param("themeId") Long themeId,
                                               @Param("userId") Long userId,
                                               Pageable pageable);

    /** Home feed: solo utenti seguiti, esclusi i bloccati */
    @Query("SELECT c FROM Content c WHERE c.status = 'ACTIVE' " +
           "AND c.author.id IN (SELECT f.followed.id FROM Follow f WHERE f.follower.id = :userId) " +
           "AND NOT EXISTS (SELECT b FROM Block b WHERE " +
           "   (b.blocker.id = :userId AND b.blocked.id = c.author.id) OR " +
           "   (b.blocked.id = :userId AND b.blocker.id = c.author.id)) " +
           "ORDER BY c.createdAt DESC")
    Page<Content> findHomeFeed(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT c FROM Content c WHERE c.status = 'ACTIVE' " +
           "AND (LOWER(c.title) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "     OR LOWER(c.body) LIKE LOWER(CONCAT('%', :q, '%'))) " +
           "AND (:themeId IS NULL OR c.theme.id = :themeId) " +
           "ORDER BY c.createdAt DESC")
    Page<Content> searchContents(@Param("q") String q,
                                 @Param("themeId") Long themeId,
                                 Pageable pageable);
}
