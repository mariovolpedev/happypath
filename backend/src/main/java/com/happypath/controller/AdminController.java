package com.happypath.controller;

import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.ModerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ModerationService moderationService;

    /** Decisione finale su ban contestati — solo admin */
    @PostMapping("/bans/{banId}/lift")
    public ResponseEntity<Void> liftBan(
            @PathVariable Long banId,
            @RequestParam String decision,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        moderationService.liftBan(banId, decision, details.getUser());
        return ResponseEntity.ok().build();
    }
}
