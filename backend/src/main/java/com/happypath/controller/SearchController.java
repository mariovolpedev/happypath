package com.happypath.controller;

import com.happypath.dto.response.SearchResultResponse;
import com.happypath.model.User;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    /**
     * Ricerca unificata: contenuti, utenti e alter ego.
     * @param q       Query di ricerca (obbligatorio)
     * @param type    Tipo: CONTENT | USER | ALTER_EGO (opzionale — tutti se assente)
     * @param themeId Filtra i contenuti per tema (opzionale, valido solo per CONTENT)
     */
    @GetMapping
    public ResponseEntity<SearchResultResponse> search(
            @RequestParam String q,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long themeId,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        User currentUser = details != null ? details.getUser() : null;
        return ResponseEntity.ok(searchService.search(q, type, themeId, currentUser));
    }
}
