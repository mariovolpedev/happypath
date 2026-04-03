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

    @Query("SELECT c FROM Content c WHERE c.status = 'ACTIVE' AND c.author.id IN " +
           "(SELECT f.followed.id FROM Follow f WHERE f.follower.id = :userId) " +
           "ORDER BY c.createdAt DESC")
    Page<Content> findHomeFeed(@Param("userId") Long userId, Pageable pageable);
}
