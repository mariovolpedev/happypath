package com.happypath.controller;

import com.happypath.dto.request.FeedSettingsRequest;
import com.happypath.dto.response.FeedSettingsResponse;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.FeedSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/feed/settings")
@RequiredArgsConstructor
public class FeedSettingsController {

    private final FeedSettingsService feedSettingsService;

    @GetMapping
    public ResponseEntity<FeedSettingsResponse> getSettings(
            @AuthenticationPrincipal HappyPathUserDetails principal) {
        return ResponseEntity.ok(feedSettingsService.getSettings(principal.getUsername()));
    }

    @PutMapping
    public ResponseEntity<FeedSettingsResponse> updateSettings(
            @RequestBody FeedSettingsRequest req,
            @AuthenticationPrincipal HappyPathUserDetails principal) {
        return ResponseEntity.ok(
                feedSettingsService.updateSettings(principal.getUsername(), req)
        );
    }
}
