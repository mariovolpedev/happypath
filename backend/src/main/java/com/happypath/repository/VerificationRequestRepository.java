package com.happypath.repository;

import com.happypath.model.User;
import com.happypath.model.VerificationRequest;
import com.happypath.model.VerificationRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VerificationRequestRepository extends JpaRepository<VerificationRequest, Long> {

    Optional<VerificationRequest> findByUserAndStatus(User user, VerificationRequestStatus status);

    Optional<VerificationRequest> findTopByUserOrderByCreatedAtDesc(User user);

    boolean existsByUserAndStatus(User user, VerificationRequestStatus status);

    Page<VerificationRequest> findByStatusOrderByCreatedAtAsc(VerificationRequestStatus status, Pageable pageable);
}
