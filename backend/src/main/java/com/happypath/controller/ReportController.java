package com.happypath.controller;

import com.happypath.dto.request.ReportRequest;
import com.happypath.dto.response.ReportResponse;
import com.happypath.security.HappyPathUserDetails;
import com.happypath.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<Void> report(
            @Valid @RequestBody ReportRequest req,
            @AuthenticationPrincipal HappyPathUserDetails details) {
        reportService.createReport(req, details.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** Segnalazioni inviate dall'utente autenticato, con il loro stato di revisione */
    @GetMapping("/mine")
    public ResponseEntity<Page<ReportResponse>> getMyReports(
            @AuthenticationPrincipal HappyPathUserDetails details,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(reportService.getMyReports(details.getUser(), pageable));
    }
}
