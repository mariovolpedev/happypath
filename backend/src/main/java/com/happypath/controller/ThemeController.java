package com.happypath.controller;

import com.happypath.dto.response.ThemeResponse;
import com.happypath.service.ThemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/themes")
@RequiredArgsConstructor
public class ThemeController {

    private final ThemeService themeService;

    @GetMapping
    public ResponseEntity<List<ThemeResponse>> getAll() {
        return ResponseEntity.ok(themeService.getAll());
    }
}
