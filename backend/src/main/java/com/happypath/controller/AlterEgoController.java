package com.happypath.controller;

import com.happypath.dto.request.AlterEgoRequest;
import com.happypath.dto.response.AlterEgoResponse;
import com.happypath.dto.response.ContentResponse;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.AlterEgoService;
import com.happypath.service.ContentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/alter-egos")
@RequiredArgsConstructor
public class AlterEgoController {

    private final AlterEgoService alterEgoService;
    private final ContentService  contentService;

    // ── Endpoints autenticati ────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<AlterEgoResponse>> getMine(
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(alterEgoService.getMyAlterEgos(details.getUser()));
    }

    @PostMapping
    public ResponseEntity<AlterEgoResponse> create(
            @Valid @RequestBody AlterEgoRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(alterEgoService.create(req, details.getUser()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        alterEgoService.delete(id, details.getUser());
        return ResponseEntity.noContent().build();
    }

    // ── Endpoints pubblici (profilo alter ego) ───────────────────────────

    @GetMapping("/{id}/profile")
    public ResponseEntity<AlterEgoResponse> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(alterEgoService.getById(id));
    }

    @GetMapping("/{id}/contents")
    public ResponseEntity<Page<ContentResponse>> getContents(
            @PathVariable Long id,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(contentService.getByAlterEgo(id, pageable));
    }
}
