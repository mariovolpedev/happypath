package com.happypath.controller;

import com.happypath.dto.request.UpdateProfileRequest;
import com.happypath.dto.response.MediaUploadResponse;
import com.happypath.dto.response.UserProfile;
import com.happypath.dto.response.UserSummary;
import com.happypath.exception.HappyPathException;
import com.happypath.model.User;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.BlockService;
import com.happypath.service.MediaStorageService;
import com.happypath.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private static final long   MAX_AVATAR_BYTES   = 5 * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif");

    private final UserService          userService;
    private final BlockService         blockService;
    private final MediaStorageService  mediaStorageService;

    @GetMapping("/{username}/profile")
    public ResponseEntity<UserProfile> getProfile(
            @PathVariable String username,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        User currentUser = details != null ? details.getUser() : null;
        return ResponseEntity.ok(userService.getProfile(username, currentUser));
    }

    @PatchMapping("/me")
    public ResponseEntity<UserProfile> updateProfile(
            @Valid @RequestBody UpdateProfileRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        requireAuthenticated(details);
        return ResponseEntity.ok(userService.updateProfile(details.getUser(), req));
    }

    /**
     * Uploads a new avatar for the authenticated user.
     *
     * Security:
     *  - Validates content-type against an allowlist (JPEG, PNG, WebP, GIF).
     *  - Enforces a 5 MB size cap independent of the multipart configuration.
     *  - Rejects files whose declared content-type is null or not in the allowlist.
     */
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaUploadResponse> uploadAvatar(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal HappyPathUserDetails details) {

        requireAuthenticated(details);
        validateImageFile(file);

        String url = mediaStorageService.upload(file, "avatars");
        UpdateProfileRequest req = new UpdateProfileRequest(null, null, url, null);
        userService.updateProfile(details.getUser(), req);

        String objectKey = extractObjectKey(url);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                new MediaUploadResponse(url, objectKey, file.getContentType(), file.getSize()));
    }

    /**
     * Segna il tutorial come completato per l'utente autenticato.
     * Idempotente: può essere chiamato più volte senza effetti negativi.
     * POST /users/me/tutorial-completed
     */
    @PostMapping("/me/tutorial-completed")
    public ResponseEntity<UserSummary> completeTutorial(
            @AuthenticationPrincipal HappyPathUserDetails details) {
        requireAuthenticated(details);
        User user = details.getUser();
        if (!user.isTutorialCompleted()) {
            user.setTutorialCompleted(true);
            userService.save(user);
        }
        return ResponseEntity.ok(userService.toSummary(user));
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<Void> follow(@PathVariable Long id,
                                       @AuthenticationPrincipal HappyPathUserDetails details) {
        requireAuthenticated(details);
        userService.follow(details.getUser(), id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/follow")
    public ResponseEntity<Void> unfollow(@PathVariable Long id,
                                         @AuthenticationPrincipal HappyPathUserDetails details) {
        requireAuthenticated(details);
        userService.unfollow(details.getUser(), id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{followerId}/followers/me")
    public ResponseEntity<Void> removeFollower(
            @PathVariable Long followerId,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        requireAuthenticated(details);
        userService.removeFollower(details.getUser(), followerId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/block")
    public ResponseEntity<Void> block(@PathVariable Long id,
                                      @AuthenticationPrincipal HappyPathUserDetails details) {
        requireAuthenticated(details);
        blockService.block(details.getUser(), id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/block")
    public ResponseEntity<Void> unblock(@PathVariable Long id,
                                        @AuthenticationPrincipal HappyPathUserDetails details) {
        requireAuthenticated(details);
        blockService.unblock(details.getUser(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/blocked")
    public ResponseEntity<List<UserSummary>> getBlockedUsers(
            @AuthenticationPrincipal HappyPathUserDetails details) {
        requireAuthenticated(details);
        return ResponseEntity.ok(blockService.getBlockedUsers(details.getUser()));
    }

    @GetMapping("/me/followers")
    public ResponseEntity<List<UserSummary>> getMyFollowers(
            @AuthenticationPrincipal HappyPathUserDetails details) {
        requireAuthenticated(details);
        return ResponseEntity.ok(userService.getFollowers(details.getUser()));
    }

    @GetMapping("/me/following")
    public ResponseEntity<List<UserSummary>> getMyFollowing(
            @AuthenticationPrincipal HappyPathUserDetails details) {
        requireAuthenticated(details);
        return ResponseEntity.ok(userService.getFollowing(details.getUser()));
    }

    @GetMapping("/{username}/followers")
    public ResponseEntity<List<UserSummary>> getFollowersByUsername(
            @PathVariable String username) {
        return ResponseEntity.ok(userService.getFollowersByUsername(username));
    }

    @GetMapping("/{username}/following")
    public ResponseEntity<List<UserSummary>> getFollowingByUsername(
            @PathVariable String username) {
        return ResponseEntity.ok(userService.getFollowingByUsername(username));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserSummary>> search(@RequestParam String q) {
        return ResponseEntity.ok(userService.search(q));
    }

    // ---------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------

    /**
     * Throws 401 if the principal is null (malformed JWT that passed the filter).
     * Prevents NullPointerException when calling details.getUser() downstream.
     */
    private void requireAuthenticated(HappyPathUserDetails details) {
        if (details == null) {
            throw new HappyPathException("Autenticazione richiesta", HttpStatus.UNAUTHORIZED);
        }
    }

    /**
     * Validates that the uploaded file is an allowed image type and within
     * the maximum size limit.
     */
    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new HappyPathException("File non valido", HttpStatus.BAD_REQUEST);
        }
        String ct = file.getContentType();
        if (ct == null || !ALLOWED_IMAGE_TYPES.contains(ct.toLowerCase())) {
            throw new HappyPathException(
                    "Tipo di file non consentito. Formati accettati: JPEG, PNG, WebP, GIF",
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new HappyPathException(
                    "Il file supera la dimensione massima consentita (5 MB)",
                    HttpStatus.PAYLOAD_TOO_LARGE);
        }
    }

    private String extractObjectKey(String fullUrl) {
        int idx = fullUrl.indexOf("/happypath-media/");
        if (idx == -1) return fullUrl;
        return fullUrl.substring(idx + "/happypath-media/".length());
    }
}
