package com.happypath.controller;

import com.happypath.dto.response.FeedItemResponse;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.FeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/feed")
@RequiredArgsConstructor
public class FeedController {

    private final FeedService feedService;

    /**
     * Restituisce il feed personalizzato dell'utente autenticato.
     *
     * @param page pagina (default 0)
     * @param size numero di elementi per pagina (default 20)
     */
    @GetMapping
    public ResponseEntity<List<FeedItemResponse>> getFeed(
            @AuthenticationPrincipal HappyPathUserDetails principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
                feedService.getFeed(principal.getUsername(), page, size)
        );
    }
}
