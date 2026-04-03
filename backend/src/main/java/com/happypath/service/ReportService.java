package com.happypath.service;

import com.happypath.dto.request.ReportRequest;
import com.happypath.dto.response.ReportResponse;
import com.happypath.model.*;
import com.happypath.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserService userService;

    @Transactional
    public void createReport(ReportRequest req, User reporter) {
        reportRepository.save(Report.builder()
                .reporter(reporter)
                .targetType(req.targetType())
                .targetId(req.targetId())
                .reason(req.reason())
                .build());
    }

    public Page<ReportResponse> getPendingReports(Pageable pageable) {
        return reportRepository.findByStatusOrderByCreatedAtDesc(ReportStatus.PENDING, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public ReportResponse resolveReport(Long id, String note, boolean dismiss, User reviewer) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new com.happypath.exception.HappyPathException("Segnalazione non trovata",
                        org.springframework.http.HttpStatus.NOT_FOUND));
        report.setStatus(dismiss ? ReportStatus.DISMISSED : ReportStatus.RESOLVED);
        report.setReviewer(reviewer);
        report.setReviewNote(note);
        report.setReviewedAt(LocalDateTime.now());
        return toResponse(reportRepository.save(report));
    }

    private ReportResponse toResponse(Report r) {
        return new ReportResponse(r.getId(), userService.toSummary(r.getReporter()),
                r.getTargetType(), r.getTargetId(), r.getReason(), r.getStatus(),
                r.getReviewNote(), r.getCreatedAt());
    }
}
