package com.happypath.repository;

import com.happypath.model.Report;
import com.happypath.model.ReportStatus;
import com.happypath.model.ReportTarget;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {
    Page<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);
    Page<Report> findByTargetTypeAndTargetIdAndStatus(ReportTarget targetType, Long targetId, ReportStatus status, Pageable pageable);
}
