package com.happypath.service;

import com.happypath.config.RedisConfig;
import com.happypath.dto.request.ThemeCreateRequest;
import com.happypath.dto.response.ThemeResponse;
import com.happypath.exception.ConflictException;
import com.happypath.exception.ResourceNotFoundException;
import com.happypath.model.Theme;
import com.happypath.model.ThemeFollow;
import com.happypath.model.User;
import com.happypath.repository.ThemeFollowRepository;
import com.happypath.repository.ThemeRepository;
import com.happypath.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ThemeService {

    private final ThemeRepository themeRepository;
    private final ThemeFollowRepository themeFollowRepository;
    private final UserRepository userRepository;

    /**
     * Lista completa temi — cachata 60 min.
     * La chiave contiene lo username perché il campo followedByMe è user-specific.
     * Se currentUsername è null (utente anonimo) la chiave è "anon".
     */
    @Transactional(readOnly = true)
    @Cacheable(value = RedisConfig.CACHE_THEMES_ALL,
               key = "#currentUsername != null ? #currentUsername : 'anon'")
    public List<ThemeResponse> getAll(String currentUsername) {
        return toResponseList(themeRepository.findAll(), currentUsername);
    }

    /**
     * Solo temi preset — cachata 60 min.
     * I preset sono quasi immutabili, TTL lungo è sicuro.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = RedisConfig.CACHE_THEMES_PRESETS,
               key = "#currentUsername != null ? #currentUsername : 'anon'")
    public List<ThemeResponse> getPresets(String currentUsername) {
        return toResponseList(themeRepository.findByPresetTrue(), currentUsername);
    }

    @Transactional(readOnly = true)
    public List<ThemeResponse> getCustom(String currentUsername) {
        // Temi custom creati dagli utenti: non cachati perché cambiano con
        // ogni create/follow/unfollow e la lista è tipicamente breve.
        return toResponseList(themeRepository.findByPresetFalse(), currentUsername);
    }

    @Transactional(readOnly = true)
    public List<ThemeResponse> getFollowedByMe(String username) {
        // Lista personale: non cachata (mutable, per-user, poco costosa)
        User me = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<Theme> themes = themeFollowRepository.findByUser(me)
                .stream().map(ThemeFollow::getTheme).toList();
        return toResponseList(themes, username);
    }

    /**
     * Creazione tema: invalida le cache themes-all (tutti gli username)
     * e themes-presets, che ora includerebbero un conteggio obsoleto.
     * Usiamo allEntries=true perché la chiave dipende dallo username.
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = RedisConfig.CACHE_THEMES_ALL,     allEntries = true),
            @CacheEvict(value = RedisConfig.CACHE_THEMES_PRESETS, allEntries = true)
    })
    public ThemeResponse create(ThemeCreateRequest req, String currentUsername) {
        if (themeRepository.existsByNameIgnoreCase(req.name())) {
            throw new ConflictException("Theme name already exists");
        }
        User me = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Theme saved = themeRepository.save(
                Theme.builder()
                        .name(req.name())
                        .description(req.description())
                        .iconEmoji(req.iconEmoji())
                        .preset(false)
                        .build()
        );
        boolean followedByMe = themeFollowRepository.existsByUserAndTheme(me, saved);
        long followersCount = themeFollowRepository.countByTheme(saved);
        return toResponse(saved, followersCount, followedByMe);
    }

    /**
     * Follow/unfollow: il campo followedByMe nella cache dell'utente diventa
     * obsoleto → invalidiamo solo le entry di quell'username.
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = RedisConfig.CACHE_THEMES_ALL,     key = "#username"),
            @CacheEvict(value = RedisConfig.CACHE_THEMES_PRESETS, key = "#username")
    })
    public void followTheme(Long themeId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Theme theme = themeRepository.findById(themeId)
                .orElseThrow(() -> new ResourceNotFoundException("Theme not found"));
        if (themeFollowRepository.existsByUserAndTheme(user, theme)) {
            throw new ConflictException("Already following this theme");
        }
        themeFollowRepository.save(ThemeFollow.builder().user(user).theme(theme).build());
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = RedisConfig.CACHE_THEMES_ALL,     key = "#username"),
            @CacheEvict(value = RedisConfig.CACHE_THEMES_PRESETS, key = "#username")
    })
    public void unfollowTheme(Long themeId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Theme theme = themeRepository.findById(themeId)
                .orElseThrow(() -> new ResourceNotFoundException("Theme not found"));
        ThemeFollow tf = themeFollowRepository.findByUserAndTheme(user, theme)
                .orElseThrow(() -> new ResourceNotFoundException("Not following this theme"));
        themeFollowRepository.delete(tf);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private List<ThemeResponse> toResponseList(List<Theme> themes, String currentUsername) {
        if (themes.isEmpty()) return List.of();

        Map<Long, Long> followerCounts = themeFollowRepository
                .countFollowersByThemes(themes)
                .stream()
                .collect(Collectors.toMap(
                        row -> (Long) row[0],
                        row -> (Long) row[1]
                ));

        Set<Long> followedIds;
        if (currentUsername != null) {
            User me = userRepository.findByUsername(currentUsername).orElse(null);
            followedIds = me == null ? Set.of()
                    : Set.copyOf(themeFollowRepository.findFollowedThemeIdsAmong(me, themes));
        } else {
            followedIds = Set.of();
        }

        return themes.stream()
                .map(t -> toResponse(
                        t,
                        followerCounts.getOrDefault(t.getId(), 0L),
                        followedIds.contains(t.getId())
                ))
                .toList();
    }

    private ThemeResponse toResponse(Theme t, long followersCount, boolean followedByMe) {
        return new ThemeResponse(
                t.getId(),
                t.getName(),
                t.getDescription(),
                t.getIconEmoji(),
                t.isPreset(),
                followersCount,
                followedByMe,
                t.getCreatedAt()
        );
    }
}
