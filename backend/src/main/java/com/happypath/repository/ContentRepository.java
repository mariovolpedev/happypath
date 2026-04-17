package com.happypath.repository;

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

    Page<Content> findByStatusOrderByCreatedAtDesc(ContentStatus status, Pageable pageable);

    Page<Content> findByAuthorAndStatusOrderByCreatedAtDesc(User author, ContentStatus status, Pageable pageable);

    Page<Content> findByThemeAndStatusOrderByCreatedAtDesc(Theme theme, ContentStatus status, Pageable pageable);

    long countByAuthorAndStatus(User author, ContentStatus status);

    @Query("SELECT c FROM Content c WHERE c.author IN :authors AND c.status = :status ORDER BY c.createdAt DESC")
    Page<Content> findByAuthorsAndStatus(
            @Param("authors") List<User> authors,
            @Param("status") ContentStatus status,
            Pageable pageable
    );

    @Query("SELECT c FROM Content c WHERE c.theme.id IN :themeIds AND c.status = :status ORDER BY c.createdAt DESC")
    Page<Content> findByThemeIdsAndStatus(
            @Param("themeIds") List<Long> themeIds,
            @Param("status") ContentStatus status,
            Pageable pageable
    );

    @Query("SELECT c FROM Content c WHERE (c.author IN :authors OR c.theme.id IN :themeIds) AND c.status = :status ORDER BY c.createdAt DESC")
    Page<Content> findByAuthorsOrThemeIdsAndStatus(
            @Param("authors") List<User> authors,
            @Param("themeIds") List<Long> themeIds,
            @Param("status") ContentStatus status,
            Pageable pageable
    );
}
