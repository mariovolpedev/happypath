package com.happypath.dto.response;

import com.happypath.model.AlterEgoVerificationStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AlterEgoVerificationResponse(
        Long id,
        AlterEgoResponse alterEgo,
        UserSummary requester,

        // Dati anagrafici visibili solo a moderatori/admin (mascherati per l'utente)
        String firstName,
        String lastName,
        LocalDate birthDate,
        String birthPlace,
        String codiceFiscale,

        AlterEgoVerificationStatus status,
        UserSummary reviewer,
        String reviewNote,
        LocalDateTime createdAt,
        LocalDateTime reviewedAt
) {}
