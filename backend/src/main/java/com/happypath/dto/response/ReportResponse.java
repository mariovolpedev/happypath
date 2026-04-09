package com.happypath.dto.response;

import com.happypath.model.ReportStatus;
import com.happypath.model.ReportTarget;
import java.time.LocalDateTime;

public record ReportResponse(
        Long id,
        UserSummary reporter,
        ReportTarget targetType,
        Long targetId,
        String reason,
        ReportStatus status,
        String reviewNote,
        LocalDateTime createdAt,

        /** Popolato quando targetType = USER */
        UserSummary targetUser,

        /** Popolato quando targetType = CONTENT */
        ContentResponse targetContent,

        /** Popolato quando targetType = COMMENT */
        String targetCommentText
) {}
