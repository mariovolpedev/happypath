package com.happypath.controller;

import com.happypath.dto.request.UpdateProfileRequest;
import com.happypath.dto.response.MediaUploadResponse;
import com.happypath.dto.response.UserProfile;
import com.happypath.dto.response.UserSummary;
import com.happypath.model.User;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.AuthService;
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

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

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
        return ResponseEntity.ok(userService.updateProfile(details.getUser(), req));
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaUploadResponse> uploadAvatar(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal HappyPathUserDetails details) {

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
        User user = details.getUser();
        if (!user.isTutorialCompleted()) {
            user.setTutorialCompleted(true);
            userService.save(user);
        }
        return ResponseEntity.ok(AuthService.toSummary(user));
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<Void> follow(@PathVariable Long id,
                                       @AuthenticationPrincipal HappyPathUserDetails details) {
        userService.follow(details.getUser(), id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/follow")
    public ResponseEntity<Void> unfollow(@PathVariable Long id,
                                         @AuthenticationPrincipal HappyPathUserDetails details) {
        userService.unfollow(details.getUser(), id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{followerId}/followers/me")
    public ResponseEntity<Void> removeFollower(
            @PathVariable Long followerId,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        userService.removeFollower(details.getUser(), followerId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/block")
    public ResponseEntity<Void> block(@PathVariable Long id,
                                      @AuthenticationPrincipal HappyPathUserDetails details) {
        blockService.block(details.getUser(), id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/block")
    public ResponseEntity<Void> unblock(@PathVariable Long id,
                                        @AuthenticationPrincipal HappyPathUserDetails details) {
        blockService.unblock(details.getUser(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me/blocked")
    public ResponseEntity<List<UserSummary>> getBlockedUsers(
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(blockService.getBlockedUsers(details.getUser()));
    }

    @GetMapping("/me/followers")
    public ResponseEntity<List<UserSummary>> getMyFollowers(
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(userService.getFollowers(details.getUser()));
    }

    @GetMapping("/me/following")
    public ResponseEntity<List<UserSummary>> getMyFollowing(
            @AuthenticationPrincipal HappyPathUserDetails details) {
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

    // -------------------------------------------------------------------------

    private String extractObjectKey(String fullUrl) {
        int idx = fullUrl.indexOf("/happypath-media/");
        if (idx == -1) return fullUrl;
        return fullUrl.substring(idx + "/happypath-media/".length());
    }
}
