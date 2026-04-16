package com.happypath.dto.request;

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 50) String username,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8) String password,
        @NotBlank @Size(min = 3, max = 80) String displayName,
        @NotNull java.time.LocalDate birthDate
) {}
