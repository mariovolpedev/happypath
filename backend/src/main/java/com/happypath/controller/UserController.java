package com.happypath.controller;

import com.happypath.dto.request.UpdateProfileRequest;
import com.happypath.dto.response.UserProfile;
import com.happypath.dto.response.UserSummary;
import com.happypath.model.User;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

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

    @GetMapping("/search")
    public ResponseEntity<List<UserSummary>> search(@RequestParam String q) {
        return ResponseEntity.ok(userService.search(q));
    }
}
