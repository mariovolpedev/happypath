package com.happypath.service;

import com.happypath.dto.response.AlterEgoResponse;
import com.happypath.dto.response.ContentResponse;
import com.happypath.dto.response.SearchResultResponse;
import com.happypath.dto.response.UserSummary;
import com.happypath.model.User;
import com.happypath.repository.AlterEgoRepository;
import com.happypath.repository.ContentRepository;
import com.happypath.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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

    public SearchResultResponse search(String q, String type, Long themeId, User currentUser) {
        if (q == null || q.isBlank()) {
            return new SearchResultResponse(List.of(), List.of(), List.of());
        }

        String query = q.trim();
        Pageable pageable = PageRequest.of(0, 20);

        List<ContentResponse> contents  = List.of();
        List<UserSummary>    users      = List.of();
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
                    .map(ae -> new AlterEgoResponse(
                            ae.getId(), ae.getName(), ae.getDescription(),
                            ae.getAvatarUrl(), userService.toSummary(ae.getOwner()),
                            ae.isVerified()   // ← include flag verified
                    ))
                    .toList();
        }

        return new SearchResultResponse(contents, users, alterEgos);
    }
}
