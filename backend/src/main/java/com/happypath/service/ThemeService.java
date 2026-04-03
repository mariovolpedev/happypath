package com.happypath.service;

import com.happypath.dto.response.ThemeResponse;
import com.happypath.model.Theme;
import com.happypath.repository.ThemeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ThemeService {

    private final ThemeRepository themeRepository;

    public List<ThemeResponse> getAll() {
        return themeRepository.findAll().stream()
                .map(t -> new ThemeResponse(t.getId(), t.getName(), t.getDescription(), t.getIconEmoji()))
                .toList();
    }
}
