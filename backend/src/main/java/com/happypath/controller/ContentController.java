package com.happypath.controller;

import com.happypath.dto.request.ContentRequest;
import com.happypath.dto.request.PublishAsRequest;
import com.happypath.dto.response.ContentResponse;
import com.happypath.model.ReactionType;
import com.happypath.model.User;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.CommentService;
import com.happypath.service.ContentService;
import com.happypath.service.MediaStorageService;
import com.happypath.service.ReactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Contents", description = "Creazione e gestione dei contenuti")
@RestController
@RequestMapping("/contents")
@RequiredArgsConstructor
public class ContentController {

    private final ContentService       contentService;
    private final ReactionService      reactionService;
    private final CommentService       commentService;
    private final MediaStorageService  mediaStorageService;

    // -------------------------------------------------------------------------
    // GET
    // -------------------------------------------------------------------------

    @Operation(summary = "Recupera il feed (tutti o per tema)")
    @GetMapping
    public ResponseEntity<Page<ContentResponse>> getFeed(
            @RequestParam(required = false) Long themeId,
            @AuthenticationPrincipal HappyPathUserDetails details,
            @PageableDefault(size = 20, sort = "createdAt",
                             direction = Sort.Direction.DESC) Pageable pageable) {
        User currentUser = details != null ? details.getUser() : null;
        if (themeId != null)
            return ResponseEntity.ok(contentService.getByTheme(themeId, pageable, currentUser));
        return ResponseEntity.ok(contentService.getFeed(pageable, currentUser));
    }

    @Operation(summary = "Recupera il feed personalizzato per l'utente loggato")
    @GetMapping("/home")
    public ResponseEntity<Page<ContentResponse>> getHomeFeed(
            @AuthenticationPrincipal HappyPathUserDetails details,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(contentService.getHomeFeed(details.getUser(), pageable));
    }

    @Operation(summary = "Recupera un contenuto per ID")
    @GetMapping("/{id}")
    public ResponseEntity<ContentResponse> getOne(
            @PathVariable Long id,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(
                contentService.getOne(id, details != null ? details.getUser() : null));
    }

    // -------------------------------------------------------------------------
    // POST – creazione con JSON (mediaUrl già noto)
    // -------------------------------------------------------------------------

    @Operation(summary = "Crea un nuovo contenuto (JSON). Il mediaUrl può essere ottenuto prima tramite POST /media/upload")
    @PostMapping
    public ResponseEntity<ContentResponse> create(
            @Valid @RequestBody ContentRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contentService.create(req, details.getUser()));
    }

    // -------------------------------------------------------------------------
    // POST – creazione con upload diretto del media (multipart)
    // -------------------------------------------------------------------------

    /**
     * Crea un contenuto caricando direttamente il file media (immagine o video)
     * senza dover inserire un URL esterno.
     *
     * Richiesta: multipart/form-data con i campi:
     *   - file           (obbligatorio se si vuole allegare un media)
     *   - title          (obbligatorio, max 200 caratteri)
     *   - body           (opzionale)
     *   - themeId        (opzionale)
     *   - alterEgoId     (opzionale)
     *   - dedicatedToUserId (opzionale)
     *
     * Il backend carica il file su MinIO e usa l'URL ottenuto come mediaUrl
     * nella ContentRequest prima di salvare il contenuto.
     */
    @Operation(summary = "Crea un contenuto con upload diretto di immagine/video (multipart/form-data)")
    @PostMapping(value = "/with-media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ContentResponse> createWithMedia(
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestParam @NotBlank @Size(max = 200) String title,
            @RequestParam(required = false) String body,
            @RequestParam(required = false) Long themeId,
            @RequestParam(required = false) Long alterEgoId,
            @RequestParam(required = false) Long dedicatedToUserId,
            @AuthenticationPrincipal HappyPathUserDetails details) {

        String mediaUrl = null;
        if (file != null && !file.isEmpty()) {
            // Determina automaticamente la sotto-cartella dal MIME type
            String contentType = file.getContentType() != null ? file.getContentType() : "";
            String subfolder   = contentType.startsWith("video/") ? "videos" : "images";
            mediaUrl = mediaStorageService.upload(file, subfolder);
        }

        ContentRequest req = new ContentRequest(
                title, body, mediaUrl, themeId, alterEgoId, dedicatedToUserId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contentService.create(req, details.getUser()));
    }

    // -------------------------------------------------------------------------
    // PUT / PATCH / DELETE
    // -------------------------------------------------------------------------

    @Operation(summary = "Aggiorna un contenuto esistente")
    @PutMapping("/{id}")
    public ResponseEntity<ContentResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ContentRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(contentService.update(id, req, details.getUser()));
    }

    /**
     * PATCH /contents/{id}/publisher
     * Cambia il profilo con cui il contenuto è pubblicato.
     * { "alterEgoId": null }   → profilo reale
     * { "alterEgoId": 42 }    → alter ego con id 42
     */
    @Operation(summary = "Cambia il publisher del contenuto (utente reale o alter ego)")
    @PatchMapping("/{id}/publisher")
    public ResponseEntity<ContentResponse> changePublisher(
            @PathVariable Long id,
            @RequestBody PublishAsRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(
                contentService.changePublisher(id, details.getUser(), req.alterEgoId()));
    }

    @Operation(summary = "Elimina un contenuto")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        contentService.delete(id, details.getUser());
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // Reactions
    // -------------------------------------------------------------------------

    @Operation(summary = "Aggiungi una reazione a un contenuto")
    @PostMapping("/{id}/reactions")
    public ResponseEntity<Void> react(
            @PathVariable Long id,
            @RequestParam ReactionType type,
            @RequestParam(required = false) Long alterEgoId,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        reactionService.react(id, type, details.getUser(), alterEgoId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Rimuovi la propria reazione da un contenuto")
    @DeleteMapping("/{id}/reactions")
    public ResponseEntity<Void> removeReaction(
            @PathVariable Long id,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        reactionService.removeReaction(id, details.getUser());
        return ResponseEntity.noContent().build();
    }
}
