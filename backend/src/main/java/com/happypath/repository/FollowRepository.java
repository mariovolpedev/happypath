package com.happypath.repository;

import com.happypath.model.Follow;
import com.happypath.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    boolean existsByFollowerAndFollowed(User follower, User followed);
    Optional<Follow> findByFollowerAndFollowed(User follower, User followed);
    long countByFollowed(User followed);
    long countByFollower(User follower);
    List<Follow> findByFollower(User follower);
    List<Follow> findByFollowed(User followed);
}
