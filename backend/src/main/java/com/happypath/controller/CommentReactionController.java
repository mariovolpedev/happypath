package com.happypath.controller;

import com.happypath.dto.request.CommentReactionRequest;
import com.happypath.dto.response.CommentReactionResponse;
import com.happypath.dto.response.CommentReactionSummaryResponse;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.CommentReactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contents/{contentId}/comments/{commentId}/reactions")
@RequiredArgsConstructor
public class CommentReactionController {

    private final CommentReactionService commentReactionService;

    /** Lista di tutte le reazioni su un commento. */
    @GetMapping
    public ResponseEntity<List<CommentReactionResponse>> getReactions(
            @PathVariable Long contentId,
            @PathVariable Long commentId) {
        return ResponseEntity.ok(commentReactionService.getReactions(commentId));
    }

    /** Aggiunge o sostituisce la reazione dell'utente corrente su un commento.
     *  Se l'utente ha già reagito con un tipo diverso, la vecchia reazione
     *  viene rimossa e sostituita con quella nuova. */
    @PutMapping
    public ResponseEntity<CommentReactionSummaryResponse> react(
            @PathVariable Long contentId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentReactionRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(
                commentReactionService.react(
                        commentId, req.type(), details.getUser(), req.alterEgoId()));
    }

    /** Rimuove la reazione dell'utente corrente dal commento. */
    @DeleteMapping
    public ResponseEntity<CommentReactionSummaryResponse> removeReaction(
            @PathVariable Long contentId,
            @PathVariable Long commentId,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(
                commentReactionService.removeReaction(commentId, details.getUser()));
    }
}
