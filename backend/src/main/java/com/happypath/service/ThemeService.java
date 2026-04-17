package com.happypath.service;

import com.happypath.dto.request.ThemeCreateRequest;
import com.happypath.dto.response.ThemeResponse;
import com.happypath.exception.ConflictException;
import com.happypath.exception.NotFoundException;
import com.happypath.model.Theme;
import com.happypath.model.ThemeFollow;
import com.happypath.model.User;
import com.happypath.repository.ThemeFollowRepository;
import com.happypath.repository.ThemeRepository;
import com.happypath.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ThemeService {

    private final ThemeRepository themeRepository;
    private final ThemeFollowRepository themeFollowRepository;
    private final UserRepository userRepository;

    // ------------------------------------------------------------------ query

    public List<ThemeResponse> getAll(String currentUsername) {
        User me = currentUsername != null ? userRepository.findByUsername(currentUsername).orElse(null) : null;
        return themeRepository.findAll().stream()
                .map(t -> toResponse(t, me))
                .toList();
    }

    public List<ThemeResponse> getPresets(String currentUsername) {
        User me = currentUsername != null ? userRepository.findByUsername(currentUsername).orElse(null) : null;
        return themeRepository.findByPresetTrue().stream()
                .map(t -> toResponse(t, me))
                .toList();
    }

    public List<ThemeResponse> getCustom(String currentUsername) {
        User me = currentUsername != null ? userRepository.findByUsername(currentUsername).orElse(null) : null;
        return themeRepository.findByPresetFalse().stream()
                .map(t -> toResponse(t, me))
                .toList();
    }

    public List<ThemeResponse> getFollowedByMe(String username) {
        User me = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return themeFollowRepository.findByUser(me).stream()
                .map(tf -> toResponse(tf.getTheme(), me))
                .toList();
    }

    // --------------------------------------------------------------- commands

    @Transactional
    public ThemeResponse create(ThemeCreateRequest req, String currentUsername) {
        if (themeRepository.findAll().stream().anyMatch(t -> t.getName().equalsIgnoreCase(req.name()))) {
            throw new ConflictException("Theme name already exists");
        }
        User me = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new NotFoundException("User not found"));
        Theme saved = themeRepository.save(
                Theme.builder()
                        .name(req.name())
                        .description(req.description())
                        .iconEmoji(req.iconEmoji())
                        .preset(false)
                        .build()
        );
        return toResponse(saved, me);
    }

    @Transactional
    public void followTheme(Long themeId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        Theme theme = themeRepository.findById(themeId)
                .orElseThrow(() -> new NotFoundException("Theme not found"));
        if (themeFollowRepository.existsByUserAndTheme(user, theme)) {
            throw new ConflictException("Already following this theme");
        }
        themeFollowRepository.save(ThemeFollow.builder().user(user).theme(theme).build());
    }

    @Transactional
    public void unfollowTheme(Long themeId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found"));
        Theme theme = themeRepository.findById(themeId)
                .orElseThrow(() -> new NotFoundException("Theme not found"));
        ThemeFollow tf = themeFollowRepository.findByUserAndTheme(user, theme)
                .orElseThrow(() -> new NotFoundException("Not following this theme"));
        themeFollowRepository.delete(tf);
    }

    // ----------------------------------------------------------------- helper

    private ThemeResponse toResponse(Theme t, User me) {
        boolean followedByMe = me != null && themeFollowRepository.existsByUserAndTheme(me, t);
        long followersCount = themeFollowRepository.countByTheme(t);
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
