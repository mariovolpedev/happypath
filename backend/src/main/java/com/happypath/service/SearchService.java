package com.happypath.service;

import com.happypath.config.RedisConfig;
import com.happypath.dto.response.*;
import com.happypath.model.User;
import com.happypath.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final ContentRepository  contentRepository;
    private final UserRepository     userRepository;
    private final AlterEgoRepository alterEgoRepository;
    private final ContentService     contentService;
    private final UserService        userService;
    private final AlterEgoService    alterEgoService;

    /**
     * Ricerca full-text — cachata 2 minuti.
     *
     * La chiave è costruita su (query, type, themeId) ignorando l'utente
     * autenticato. Questo è sicuro perché SearchService restituisce dati
     * pubblici (titoli, username, alter ego) non sensibili al contesto utente.
     *
     * Il TTL breve (2 min) mitiga il rischio di risultati stantii su
     * contenuti appena creati o eliminati.
     *
     * NON cachechiamo ricerche vuote (unless condition).
     */
    @Cacheable(
            value = RedisConfig.CACHE_SEARCH_RESULTS,
            key = "(#q ?: '') + ':' + (#type ?: 'ALL') + ':' + (#themeId ?: 0)",
            unless = "#q == null || #q.isBlank()")
    public SearchResultResponse search(
            String q, String type, Long themeId, User currentUser) {
        if (q == null || q.isBlank())
            return new SearchResultResponse(List.of(), List.of(), List.of());

        String query = q.trim();
        Pageable pageable = PageRequest.of(0, 20);

        List<ContentResponse>  contents  = List.of();
        List<UserSummary>      users     = List.of();
        List<AlterEgoResponse> alterEgos = List.of();

        if (type == null || type.equalsIgnoreCase("CONTENT")) {
            contents = contentRepository.searchContents(query, themeId, pageable)
                    .stream()
                    .map(c -> contentService.toResponse(c, currentUser))
                    .toList();
        }

        if (type == null || type.equalsIgnoreCase("USER")) {
            users = userRepository.searchByUsernameOrDisplayName(query)
                    .stream()
                    .map(userService::toSummary)
                    .limit(20)
                    .toList();
        }

        if (type == null || type.equalsIgnoreCase("ALTER_EGO")) {
            alterEgos = alterEgoRepository.searchAlterEgos(query, pageable)
                    .stream()
                    .map(alterEgoService::toResponse)
                    .toList();
        }

        return new SearchResultResponse(contents, users, alterEgos);
    }
}
