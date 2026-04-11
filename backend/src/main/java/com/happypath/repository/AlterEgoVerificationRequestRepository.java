package com.happypath.repository;

import com.happypath.dto.request.AlterEgoVerificationRequest;
import com.happypath.model.AlterEgo;
import com.happypath.model.AlterEgoVerificationStatus;
import com.happypath.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AlterEgoVerificationRequestRepository
        extends JpaRepository<AlterEgoVerificationRequest, Long> {

    Page<AlterEgoVerificationRequest> findByStatusOrderByCreatedAtDesc(
            AlterEgoVerificationStatus status, Pageable pageable);

    boolean existsByAlterEgoAndStatus(AlterEgo alterEgo, AlterEgoVerificationStatus status);

    Page<AlterEgoVerificationRequest> findByRequesterOrderByCreatedAtDesc(
            User requester, Pageable pageable);

    Optional<AlterEgoVerificationRequest> findTopByAlterEgoOrderByCreatedAtDesc(AlterEgo alterEgo);
}
