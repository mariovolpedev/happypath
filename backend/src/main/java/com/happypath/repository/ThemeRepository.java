package com.happypath.repository;

import com.happypath.model.Theme;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ThemeRepository extends JpaRepository<Theme, Long> {
    List<Theme> findByPresetTrue();
    List<Theme> findByPresetFalse();
    boolean existsByNameIgnoreCase(String name);
}
