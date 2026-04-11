package com.happypath.dto.request;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record AlterEgoVerificationSubmitRequest(

        @NotNull
        Long alterEgoId,

        @NotBlank @Size(max = 100)
        String firstName,

        @NotBlank @Size(max = 100)
        String lastName,

        @NotNull @Past
        LocalDate birthDate,

        @NotBlank @Size(max = 100)
        String birthPlace,

        @NotBlank
        @Size(min = 16, max = 16, message = "Il codice fiscale deve essere di 16 caratteri")
        @Pattern(
            regexp = "^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST]{1}[0-9LMNPQRSTUV]{2}[A-Z]{1}[0-9LMNPQRSTUV]{3}[A-Z]{1}$",
            message = "Formato codice fiscale non valido"
        )
        String codiceFiscale
) {}
