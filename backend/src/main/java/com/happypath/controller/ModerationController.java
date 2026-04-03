package com.happypath.controller;

import com.happypath.dto.request.ModerationRequest;
import com.happypath.dto.response.ReportResponse;
import com.happypath.model.BanDuration;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.ModerationService;
import com.happypath.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/moderation")
@RequiredArgsConstructor
public class ModerationController {

    private final ModerationService moderationService;
    private final ReportService reportService;

    @GetMapping("/reports")
    public ResponseEntity<Page<ReportResponse>> getPendingReports(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(reportService.getPendingReports(pageable));
    }

    @PostMapping("/reports/{id}/resolve")
    public ResponseEntity<ReportResponse> resolveReport(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean dismiss,
            @RequestBody(required = false) ModerationRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        return ResponseEntity.ok(reportService.resolveReport(id,
                req != null ? req.note() : null, dismiss, details.getUser()));
    }

    @PostMapping("/contents/{id}/censor")
    public ResponseEntity<Void> censorContent(
            @PathVariable Long id,
            @RequestBody ModerationRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        moderationService.censorContent(id, req.note(), details.getUser());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/contents/{id}/delete")
    public ResponseEntity<Void> deleteContent(
            @PathVariable Long id,
            @RequestBody ModerationRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        moderationService.deleteContent(id, req.note(), details.getUser());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{id}/warn")
    public ResponseEntity<Void> warnUser(
            @PathVariable Long id,
            @RequestBody ModerationRequest req,
            @RequestParam(required = false) Long relatedContentId,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        moderationService.warnUser(id, req.note(), relatedContentId, details.getUser());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/users/{id}/ban")
    public ResponseEntity<Void> banUser(
            @PathVariable Long id,
            @RequestBody ModerationRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        moderationService.banUser(id, req.banDuration(), req.note(), details.getUser());
        return ResponseEntity.ok().build();
    }
}
