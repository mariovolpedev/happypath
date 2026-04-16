package com.happypath.dto.request;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

/**
 * Dati richiesti in fase di registrazione.
 * I campi anagrafici (firstName, lastName, birthDate, birthPlace, gender)
 * devono coincidere esattamente con quelli forniti successivamente
 * in fase di verifica identità, per consentire un confronto 1:1.
 */
public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 50) String username,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8) String password,
        @NotBlank @Size(min = 3, max = 80) String displayName,
        @NotBlank @Size(min = 2, max = 80) String firstName,
        @NotBlank @Size(min = 2, max = 80) String lastName,
        @NotNull LocalDate birthDate,
        @NotBlank @Size(min = 2, max = 100) String birthPlace,
        @NotBlank @Pattern(regexp = "[MF]", message = "Il genere deve essere M o F") String gender
) {}
