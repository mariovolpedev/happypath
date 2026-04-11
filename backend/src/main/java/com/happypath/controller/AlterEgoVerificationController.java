package com.happypath.controller;

import com.happypath.dto.request.AlterEgoVerificationReviewRequest;
import com.happypath.dto.request.AlterEgoVerificationSubmitRequest;
import com.happypath.dto.response.AlterEgoVerificationResponse;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.AlterEgoVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class AlterEgoVerificationController {

    private final AlterEgoVerificationService verificationService;

    // ── Utente autenticato ────────────────────────────────────────────────────

    /**
     * POST /alter-egos/verifications
     * Invia una nuova richiesta di verifica per un Alter Ego.
     */
    @PostMapping("/alter-egos/verifications")
    public ResponseEntity<AlterEgoVerificationResponse> submitRequest(
            @Valid @RequestBody AlterEgoVerificationSubmitRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(verificationService.submitRequest(req, details.getUser()));
    }

    /**
     * GET /alter-egos/verifications/mine
     * Storico richieste dell'utente autenticato (dati anagrafici mascherati).
     */
    @GetMapping("/alter-egos/verifications/mine")
    public ResponseEntity<Page<AlterEgoVerificationResponse>> getMyRequests(
            @AuthenticationPrincipal HappyPathUserDetails details,
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(
                verificationService.getMyRequests(details.getUser(), pageable));
    }

    // ── Moderatore / Admin ────────────────────────────────────────────────────

    /**
     * GET /moderation/alter-ego-verifications
     * Lista richieste in attesa con dati anagrafici completi.
     */
    @GetMapping("/moderation/alter-ego-verifications")
    @PreAuthorize("hasAnyRole('MODERATOR','ADMIN')")
    public ResponseEntity<Page<AlterEgoVerificationResponse>> getPending(
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(verificationService.getPendingRequests(pageable));
    }

    /**
     * POST /moderation/alter-ego-verifications/{id}/review
     * Approva o rifiuta una richiesta.
     */
    @PostMapping("/moderation/alter-ego-verifications/{id}/review")
    @PreAuthorize("hasAnyRole('MODERATOR','ADMIN')")
    public ResponseEntity<AlterEgoVerificationResponse> reviewRequest(
            @PathVariable Long id,
            @Valid @RequestBody AlterEgoVerificationReviewRequest decision,
            @AuthenticationPrincipal HappyPathUserDetails details) {

        return ResponseEntity.ok(
                verificationService.reviewRequest(id, decision, details.getUser()));
    }
}
