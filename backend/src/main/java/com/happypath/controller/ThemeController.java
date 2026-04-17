package com.happypath.controller;

import com.happypath.dto.request.ThemeCreateRequest;
import com.happypath.dto.response.ThemeResponse;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.ThemeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/themes")
@RequiredArgsConstructor
public class ThemeController {

    private final ThemeService themeService;

    /** Tutti i temi (preset + custom) */
    @GetMapping
    public ResponseEntity<List<ThemeResponse>> getAll(
            @AuthenticationPrincipal HappyPathUserDetails principal) {
        String username = principal != null ? principal.getUsername() : null;
        return ResponseEntity.ok(themeService.getAll(username));
    }

    /** Solo temi predefiniti */
    @GetMapping("/presets")
    public ResponseEntity<List<ThemeResponse>> getPresets(
            @AuthenticationPrincipal HappyPathUserDetails principal) {
        String username = principal != null ? principal.getUsername() : null;
        return ResponseEntity.ok(themeService.getPresets(username));
    }

    /** Solo temi personalizzati creati dagli utenti */
    @GetMapping("/custom")
    public ResponseEntity<List<ThemeResponse>> getCustom(
            @AuthenticationPrincipal HappyPathUserDetails principal) {
        String username = principal != null ? principal.getUsername() : null;
        return ResponseEntity.ok(themeService.getCustom(username));
    }

    /** Temi seguiti dall'utente corrente */
    @GetMapping("/me")
    public ResponseEntity<List<ThemeResponse>> getMyFollowed(
            @AuthenticationPrincipal HappyPathUserDetails principal) {
        return ResponseEntity.ok(themeService.getFollowedByMe(principal.getUsername()));
    }

    /** Crea un nuovo tema personalizzato */
    @PostMapping
    public ResponseEntity<ThemeResponse> create(
            @Valid @RequestBody ThemeCreateRequest req,
            @AuthenticationPrincipal HappyPathUserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(themeService.create(req, principal.getUsername()));
    }

    /** Segui un tema */
    @PostMapping("/{id}/follow")
    public ResponseEntity<Void> follow(
            @PathVariable Long id,
            @AuthenticationPrincipal HappyPathUserDetails principal) {
        themeService.followTheme(id, principal.getUsername());
        return ResponseEntity.noContent().build();
    }

    /** Smetti di seguire un tema */
    @DeleteMapping("/{id}/follow")
    public ResponseEntity<Void> unfollow(
            @PathVariable Long id,
            @AuthenticationPrincipal HappyPathUserDetails principal) {
        themeService.unfollowTheme(id, principal.getUsername());
        return ResponseEntity.noContent().build();
    }
}
