package com.happypath.dto.request;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

/**
 * DTO per la richiesta di verifica identità.
 * I campi vengono validati sia lato Jakarta Validation che
 * nel service tramite CodiceFiscaleValidator.
 */
public record VerificationRequestDto(

    @NotBlank(message = "Il nome è obbligatorio")
    @Size(max = 80)
    String firstName,

    @NotBlank(message = "Il cognome è obbligatorio")
    @Size(max = 80)
    String lastName,

    @NotNull(message = "La data di nascita è obbligatoria")
    @Past(message = "La data di nascita deve essere nel passato")
    LocalDate birthDate,

    @NotBlank(message = "Il comune di nascita è obbligatorio")
    @Size(max = 120)
    String birthPlace,

    /** M o F */
    @NotBlank(message = "Il genere è obbligatorio")
    @Pattern(regexp = "[MFmf]", message = "Il genere deve essere M o F")
    String gender,

    @NotBlank(message = "Il codice fiscale è obbligatorio")
    @Size(min = 16, max = 16, message = "Il codice fiscale deve essere di 16 caratteri")
    @Pattern(regexp = "[A-Za-z0-9]{16}", message = "Formato codice fiscale non valido")
    String fiscalCode

) {}
