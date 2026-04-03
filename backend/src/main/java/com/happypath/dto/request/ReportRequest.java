package com.happypath.dto.request;

import com.happypath.model.ReportTarget;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReportRequest(
        @NotNull ReportTarget targetType,
        @NotNull Long targetId,
        @NotBlank String reason
) {}
