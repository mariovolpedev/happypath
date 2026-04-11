package com.happypath.dto.request;

import jakarta.validation.constraints.NotNull;

public record AlterEgoVerificationReviewRequest(

        @NotNull
        Boolean approved,

        String note
) {}
