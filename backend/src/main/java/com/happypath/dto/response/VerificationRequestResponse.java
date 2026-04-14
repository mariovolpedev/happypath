package com.happypath.dto.response;

import com.happypath.model.VerificationRequest;
import com.happypath.model.VerificationRequestStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record VerificationRequestResponse(
    Long id,
    Long userId,
    String username,
    String firstName,
    String lastName,
    LocalDate birthDate,
    String birthPlace,
    String gender,
    String fiscalCode,
    VerificationRequestStatus status,
    String reviewNote,
    LocalDateTime createdAt,
    LocalDateTime reviewedAt,
    String reviewedByUsername
) {
    public static VerificationRequestResponse from(VerificationRequest r) {
        return new VerificationRequestResponse(
            r.getId(),
            r.getUser().getId(),
            r.getUser().getUsername(),
            r.getFirstName(),
            r.getLastName(),
            r.getBirthDate(),
            r.getBirthPlace(),
            r.getGender(),
            r.getFiscalCode(),
            r.getStatus(),
            r.getReviewNote(),
            r.getCreatedAt(),
            r.getReviewedAt(),
            r.getReviewedBy() != null ? r.getReviewedBy().getUsername() : null
        );
    }
}
