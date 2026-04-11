package com.happypath.service;

import com.happypath.dto.request.ReportRequest;
import com.happypath.dto.response.ContentResponse;
import com.happypath.dto.response.ReportResponse;
import com.happypath.dto.response.UserSummary;
import com.happypath.model.*;
import com.happypath.repository.CommentRepository;
import com.happypath.repository.ReportRepository;
import com.happypath.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository  reportRepository;
    private final UserService       userService;
    private final ContentService    contentService;
    private final UserRepository    userRepository;
    private final CommentRepository commentRepository;

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
        return reportRepository
                .findByStatusOrderByCreatedAtDesc(ReportStatus.PENDING, pageable)
                .map(this::toResponse);
    }

    /** Segnalazioni inviate dall'utente corrente con il loro stato */
    public Page<ReportResponse> getMyReports(User reporter, Pageable pageable) {
        return reportRepository
                .findByReporterOrderByCreatedAtDesc(reporter, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public ReportResponse resolveReport(Long id, String note, boolean dismiss, User reviewer) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new com.happypath.exception.HappyPathException(
                        "Segnalazione non trovata",
                        org.springframework.http.HttpStatus.NOT_FOUND));
        report.setStatus(dismiss ? ReportStatus.DISMISSED : ReportStatus.RESOLVED);
        report.setReviewer(reviewer);
        report.setReviewNote(note);
        report.setReviewedAt(LocalDateTime.now());
        return toResponse(reportRepository.save(report));
    }

    // Arricchisce la risposta con i dettagli dell'entità segnalata
    private ReportResponse toResponse(Report r) {
        UserSummary     targetUser        = null;
        ContentResponse targetContent     = null;
        String          targetCommentText = null;

        try {
            if (r.getTargetType() == ReportTarget.USER) {
                targetUser = userRepository.findById(r.getTargetId())
                        .map(userService::toSummary)
                        .orElse(null);
            } else if (r.getTargetType() == ReportTarget.CONTENT) {
                Content c = contentService.findById(r.getTargetId());
                targetContent = contentService.toResponse(c, null);
            } else if (r.getTargetType() == ReportTarget.COMMENT) {
                targetCommentText = commentRepository.findById(r.getTargetId())
                        .map(Comment::getText)
                        .orElse(null);
            }
        } catch (Exception ignored) {
            // Entità già eliminata — la segnalazione rimane visibile
        }

        return new ReportResponse(
                r.getId(),
                userService.toSummary(r.getReporter()),
                r.getTargetType(),
                r.getTargetId(),
                r.getReason(),
                r.getStatus(),
                r.getReviewNote(),
                r.getCreatedAt(),
                targetUser,
                targetContent,
                targetCommentText
        );
    }
}
