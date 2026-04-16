package dev.mariovolpe.happypath.content;

import dev.mariovolpe.happypath.content.dto.*;
import dev.mariovolpe.happypath.user.User;
import dev.mariovolpe.happypath.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/contents")
@RequiredArgsConstructor
public class ContentController {

    private final ContentService contentService;
    private final UserService    userService;

    // ── feed ─────────────────────────────────────────────────────────────────

    @GetMapping
    public Page<ContentResponse> getFeed(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(required = false)   Long themeId,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long requesterId = resolveRequesterId(userDetails);
        return contentService.getFeed(page, themeId, requesterId);
    }

    @GetMapping("/home")
    public Page<ContentResponse> getHomeFeed(
        @RequestParam(defaultValue = "0") int page,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        Long requesterId = resolveRequesterId(userDetails);
        return contentService.getHomeFeed(page, requesterId);
    }

    @GetMapping("/{id}")
    public ContentResponse getById(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        return contentService.getById(id, resolveRequesterId(userDetails));
    }

    // ── scrittura ────────────────────────────────────────────────────────────

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContentResponse create(
        @RequestBody ContentRequest req,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User requester = userService.findByUsername(userDetails.getUsername());
        return contentService.create(req, requester.getId());
    }

    @PutMapping("/{id}")
    public ContentResponse update(
        @PathVariable Long id,
        @RequestBody ContentRequest req,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User requester = userService.findByUsername(userDetails.getUsername());
        return contentService.update(id, req, requester.getId());
    }

    /**
     * PATCH /contents/{id}/publisher
     * Permette all'autore di cambiare il profilo con cui è pubblicato il contenuto:
     * { alterEgoId: <number> }  → pubblica come alter ego
     * { alterEgoId: null }      → pubblica come profilo reale
     */
    @PatchMapping("/{id}/publisher")
    public ResponseEntity<ContentResponse> changePublisher(
        @PathVariable Long id,
        @RequestBody PublishAsRequest req,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User requester = userService.findByUsername(userDetails.getUsername());
        ContentResponse updated = contentService.changePublisher(id, requester.getId(), req.alterEgoId());
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
        @PathVariable Long id,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        User requester = userService.findByUsername(userDetails.getUsername());
        contentService.delete(id, requester.getId(), requester.getRole().name());
    }

    // ── helper ───────────────────────────────────────────────────────────────

    private Long resolveRequesterId(UserDetails userDetails) {
        if (userDetails == null) return null;
        return userService.findByUsername(userDetails.getUsername()).getId();
    }
}
