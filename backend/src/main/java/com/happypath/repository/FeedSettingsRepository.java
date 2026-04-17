package com.happypath.repository;

import com.happypath.model.FeedSettings;
import com.happypath.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FeedSettingsRepository extends JpaRepository<FeedSettings, Long> {
    Optional<FeedSettings> findByUser(User user);
}
