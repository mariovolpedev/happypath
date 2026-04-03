package com.happypath.repository;

import com.happypath.model.User;
import com.happypath.model.Warning;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WarningRepository extends JpaRepository<Warning, Long> {
    List<Warning> findByUserOrderByCreatedAtDesc(User user);
    long countByUser(User user);
}
