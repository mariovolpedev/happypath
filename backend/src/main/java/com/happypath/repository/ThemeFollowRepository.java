package com.happypath.repository;

import com.happypath.model.Theme;
import com.happypath.model.ThemeFollow;
import com.happypath.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ThemeFollowRepository extends JpaRepository<ThemeFollow, Long> {

    boolean existsByUserAndTheme(User user, Theme theme);

    Optional<ThemeFollow> findByUserAndTheme(User user, Theme theme);

    List<ThemeFollow> findByUser(User user);

    long countByTheme(Theme theme);

    @Query("SELECT tf.theme.id FROM ThemeFollow tf WHERE tf.user = :user")
    List<Long> findFollowedThemeIdsByUser(@Param("user") User user);

    /** Ritorna i themeId seguiti dall'utente — usato per bulk check in ThemeService */
    @Query("SELECT tf.theme.id FROM ThemeFollow tf WHERE tf.user = :user AND tf.theme IN :themes")
    List<Long> findFollowedThemeIdsAmong(@Param("user") User user, @Param("themes") List<Theme> themes);

    /** Conta i follower per tutti i temi in una sola query, ritorna [themeId, count] */
    @Query("SELECT tf.theme.id, COUNT(tf) FROM ThemeFollow tf WHERE tf.theme IN :themes GROUP BY tf.theme.id")
    List<Object[]> countFollowersByThemes(@Param("themes") List<Theme> themes);
}
