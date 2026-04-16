package com.happypath.controller;

import com.happypath.dto.request.ReviewVerificationRequest;
import com.happypath.dto.request.VerificationRequestDto;
import com.happypath.dto.response.VerificationRequestResponse;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.VerificationRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequiredArgsConstructor
public class VerificationRequestController {

    private final VerificationRequestService service;

    // ── Endpoint utente ─────────────────────────────────────────────────

    /** Invia richiesta di verifica */
    @PostMapping("/verification-requests/me")
    public ResponseEntity<VerificationRequestResponse> submit(
            @Valid @RequestBody VerificationRequestDto dto,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(service.submit(details.getUser(), dto));
    }

    /** Stato dell'ultima richiesta dell'utente corrente */
    @GetMapping("/verification-requests/me")
    public ResponseEntity<VerificationRequestResponse> getMyLatest(
            @AuthenticationPrincipal HappyPathUserDetails details) {
        Optional<VerificationRequestResponse> latest = service.getMyLatest(details.getUser());
        return latest.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.noContent().build());
    }

    // ── Endpoint moderazione ─────────────────────────────────────────────

    /** Lista richieste PENDING (solo MOD/ADMIN) */
    @GetMapping("/moderation/verification-requests")
    public ResponseEntity<Page<VerificationRequestResponse>> getPending(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(service.getPending(pageable));
    }

    /** Approva una richiesta (solo MOD/ADMIN) */
    @PostMapping("/moderation/verification-requests/{id}/approve")
    public ResponseEntity<VerificationRequestResponse> approve(
            @PathVariable Long id,
            @RequestBody(required = false) ReviewVerificationRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        String note = req != null ? req.note() : null;
        return ResponseEntity.ok(service.approve(id, details.getUser(), note));
    }

    /** Rifiuta una richiesta (solo MOD/ADMIN) */
    @PostMapping("/moderation/verification-requests/{id}/reject")
    public ResponseEntity<VerificationRequestResponse> reject(
            @PathVariable Long id,
            @RequestBody(required = false) ReviewVerificationRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        String note = req != null ? req.note() : null;
        return ResponseEntity.ok(service.reject(id, details.getUser(), note));
    }
}
