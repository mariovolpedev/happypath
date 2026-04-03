package com.happypath.controller;

import com.happypath.dto.response.ContentResponse;
import com.happypath.service.ContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserContentController {

    private final ContentService contentService;

    @GetMapping("/{username}/contents")
    public ResponseEntity<Page<ContentResponse>> getUserContents(
            @PathVariable String username,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(contentService.getByUser(username, pageable));
    }
}
