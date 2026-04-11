package com.happypath.repository;

import com.happypath.model.Block;
import com.happypath.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BlockRepository extends JpaRepository<Block, Long> {
    boolean existsByBlockerAndBlocked(User blocker, User blocked);
    Optional<Block> findByBlockerAndBlocked(User blocker, User blocked);
    List<Block> findByBlocker(User blocker);
    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);
}
