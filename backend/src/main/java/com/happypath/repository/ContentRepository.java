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
import java.util.Map;
import java.util.stream.Collectors;

public interface ContentRepository extends JpaRepository<Content, Long> {

    Page<Content> findByStatusOrderByCreatedAtDesc(ContentStatus status, Pageable pageable);
    Page<Content> findByAuthorAndStatusOrderByCreatedAtDesc(User author, ContentStatus status, Pageable pageable);
    Page<Content> findByThemeAndStatusOrderByCreatedAtDesc(Theme theme, ContentStatus status, Pageable pageable);
    long countByAuthorAndStatus(User author, ContentStatus status);

    @Query("SELECT c FROM Content c WHERE c.theme.id = :themeId AND c.status = :status ORDER BY c.createdAt DESC")
    Page<Content> findByThemeIdAndStatusOrderByCreatedAtDesc(
            @Param("themeId") Long themeId, @Param("status") ContentStatus status, Pageable pageable);

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
                  c.author.id IN (SELECT f.followed.id FROM Follow f WHERE f.follower.id = :userId)
                  OR c.author.id = :userId
              )
            ORDER BY c.createdAt DESC
            """)
    Page<Content> findHomeFeed(@Param("userId") Long userId, Pageable pageable);

    @Query("""
            SELECT c FROM Content c
            WHERE c.theme.id = :themeId AND c.status = 'ACTIVE'
              AND c.author.id NOT IN (
                  SELECT b.blocked.id FROM Block b WHERE b.blocker.id = :userId
                  UNION ALL
                  SELECT b.blocker.id FROM Block b WHERE b.blocked.id = :userId
              )
            ORDER BY c.createdAt DESC
            """)
    Page<Content> findByThemeExcludingBlocked(
            @Param("themeId") Long themeId, @Param("userId") Long userId, Pageable pageable);

    @Query("""
            SELECT c FROM Content c
            WHERE (LOWER(c.title) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(c.body)  LIKE LOWER(CONCAT('%', :q, '%')))
            AND c.status = 'ACTIVE'
            AND (:themeId IS NULL OR c.theme.id = :themeId)
            ORDER BY c.createdAt DESC
            """)
    Page<Content> searchContents(
            @Param("q") String q, @Param("themeId") Long themeId, Pageable pageable);

    @Query("SELECT c FROM Content c WHERE (c.author IN :authors OR c.theme.id IN :themeIds) AND c.status = :status ORDER BY c.createdAt DESC")
    Page<Content> findByAuthorsOrThemeIdsAndStatus(
            @Param("authors") List<User> authors,
            @Param("themeIds") List<Long> themeIds,
            @Param("status") ContentStatus status,
            Pageable pageable);

    // -------------------------------------------------------------------------
    // Bulk COUNT queries — evitano N+1 su reactions/comments
    // -------------------------------------------------------------------------

    @Query("SELECT r.content.id, COUNT(r) FROM Reaction r WHERE r.content.id IN :ids GROUP BY r.content.id")
    List<Object[]> countReactionsByContentIdsRaw(@Param("ids") List<Long> ids);

    @Query("SELECT c.content.id, COUNT(c) FROM Comment c WHERE c.content.id IN :ids GROUP BY c.content.id")
    List<Object[]> countCommentsByContentIdsRaw(@Param("ids") List<Long> ids);

    @Query("SELECT r.content.id, r.type, COUNT(r) FROM Reaction r WHERE r.content.id IN :ids GROUP BY r.content.id, r.type")
    List<Object[]> countReactionsByTypeForContentIdsRaw(@Param("ids") List<Long> ids);

    default Map<Long, Long> countReactionsByContentIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return Map.of();
        return countReactionsByContentIdsRaw(ids).stream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
    }

    default Map<Long, Long> countCommentsByContentIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return Map.of();
        return countCommentsByContentIdsRaw(ids).stream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (Long) r[1]));
    }

    default Map<Long, Map<String, Long>> countReactionsByTypeForContentIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return Map.of();
        Map<Long, Map<String, Long>> result = new java.util.HashMap<>();
        for (Object[] row : countReactionsByTypeForContentIdsRaw(ids)) {
            Long contentId = (Long) row[0];
            String type    = row[1].toString();
            Long count     = (Long) row[2];
            result.computeIfAbsent(contentId, k -> new java.util.HashMap<>()).put(type, count);
        }
        return result;
    }
}
