package com.happypath.repository;

import com.happypath.model.AlterEgo;
import com.happypath.model.Content;
import com.happypath.model.ContentStatus;
import com.happypath.model.Theme;
import com.happypath.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ContentRepository extends JpaRepository<Content, Long> {

    // --- metodi pre-esistenti ---

    Page<Content> findByStatusOrderByCreatedAtDesc(ContentStatus status, Pageable pageable);

    Page<Content> findByAuthorAndStatusOrderByCreatedAtDesc(User author, ContentStatus status, Pageable pageable);

    Page<Content> findByThemeAndStatusOrderByCreatedAtDesc(Theme theme, ContentStatus status, Pageable pageable);

    long countByAuthorAndStatus(User author, ContentStatus status);

    @Query("SELECT c FROM Content c WHERE c.theme.id = :themeId AND c.status = :status ORDER BY c.createdAt DESC")
    Page<Content> findByThemeIdAndStatusOrderByCreatedAtDesc(
            @Param("themeId") Long themeId,
            @Param("status") ContentStatus status,
            Pageable pageable
    );

    Page<Content> findByAlterEgoAndStatusOrderByCreatedAtDesc(AlterEgo alterEgo, ContentStatus status, Pageable pageable);

    @Query("""
            SELECT c FROM Content c
            WHERE c.status = 'ACTIVE'
              AND c.author.id NOT IN (
                  SELECT b.blocked.id FROM Block b WHERE b.blocker.id = :userId
                  UNION ALL
                  SELECT b.blocker.id FROM Block b WHERE b.blocked.id = :userId
              )
            ORDER BY c.createdAt DESC
            """)
    Page<Content> findFeedExcludingBlocked(@Param("userId") Long userId, Pageable pageable);

    @Query("""
            SELECT c FROM Content c
            WHERE c.status = 'ACTIVE'
              AND (
                  c.author.id IN (
                      SELECT f.followed.id FROM Follow f WHERE f.follower.id = :userId
                  )
                  OR c.author.id = :userId
              )
            ORDER BY c.createdAt DESC
            """)
    Page<Content> findHomeFeed(@Param("userId") Long userId, Pageable pageable);

    @Query("""
            SELECT c FROM Content c
            WHERE c.theme.id = :themeId
              AND c.status = 'ACTIVE'
              AND c.author.id NOT IN (
                  SELECT b.blocked.id FROM Block b WHERE b.blocker.id = :userId
                  UNION ALL
                  SELECT b.blocker.id FROM Block b WHERE b.blocked.id = :userId
              )
            ORDER BY c.createdAt DESC
            """)
    Page<Content> findByThemeExcludingBlocked(
            @Param("themeId") Long themeId,
            @Param("userId") Long userId,
            Pageable pageable
    );

    @Query("""
            SELECT c FROM Content c
            WHERE LOWER(c.title) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(c.body)  LIKE LOWER(CONCAT('%', :q, '%'))
            AND c.status = 'ACTIVE'
            AND (:themeId IS NULL OR c.theme.id = :themeId)
            ORDER BY c.createdAt DESC
            """)
    Page<Content> searchContents(
            @Param("q") String q,
            @Param("themeId") Long themeId,
            Pageable pageable
    );

    // --- nuovi metodi per il feed personalizzato ---

    @Query("SELECT c FROM Content c WHERE (c.author IN :authors OR c.theme.id IN :themeIds) AND c.status = :status ORDER BY c.createdAt DESC")
    Page<Content> findByAuthorsOrThemeIdsAndStatus(
            @Param("authors") List<User> authors,
            @Param("themeIds") List<Long> themeIds,
            @Param("status") ContentStatus status,
            Pageable pageable
    );
}
